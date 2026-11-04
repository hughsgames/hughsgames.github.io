// Playing together. One player's computer is the host: it has the world and the only save. Friends join it from their
// own computers or tablets with a short code like FOX-27, and only once the host has let them in.
//
// A free public service (the PeerJS server, 0.peerjs.com) introduces the computers to each other; after that they talk
// directly, browser to browser (WebRTC). If two networks can't reach each other directly, PeerJS's own free relay
// carries the messages instead. Nothing is stored anywhere except the host's own browser, and the library that does
// all this (PeerJS) is only fetched when someone presses one of the "play together" buttons.
//
// This file is only the post office: codes, connections, letting people in and sending messages. What the messages
// say (the world, the blocks, where everyone is) is decided in game.js.

const LIB = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';
const PREFIX = 'hughsgames-polis-';    // every code is a name on the public server, so ours start with this
export const MAX_GUESTS = 3;
const PIECE = 15000;                   // longer messages go in pieces: browsers drop very long ones
const QUIET = 150000;                  // nothing heard for this long (ms) and the other computer has gone (a closed tab is noticed
                                       // much sooner: its line shuts. This is for one that just goes silent.)
const QUIET_LOADING = 300000;          // (a friend still building the world on a slow computer can be busy a long while)
const PING = 4000;                     // a guest says "still here" this often; the host answers straight back

// Short, easy words a seven-year-old can read out and type.
const WORDS = ['FOX', 'OWL', 'CAT', 'DOG', 'BEAR', 'LION', 'WOLF', 'DUCK', 'FROG', 'GOAT', 'HAWK', 'SEAL', 'SWAN', 'YAK',
  'ELK', 'EMU', 'BEE', 'ANT', 'COW', 'PIG', 'HEN', 'RAM', 'CRAB', 'DEER', 'DOVE', 'FISH', 'HARE', 'LAMB', 'LYNX', 'MULE',
  'NEWT', 'ORCA', 'PUMA', 'TOAD', 'WREN', 'APE', 'EEL', 'MOLE', 'BAT', 'IBIS'];
export function newCode() { return WORDS[Math.floor(Math.random() * WORDS.length)] + '-' + (10 + Math.floor(Math.random() * 90)); }
/// "fox 27", "Fox27" and "FOX-27" are all the same code. Anything else isn't one.
export function readCode(text) {
  const t = String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const m = /^([A-Z]{2,5})(\d{2})$/.exec(t);
  return m ? `${m[1]}-${m[2]}` : null;
}
const idOf = (code) => PREFIX + code.replace('-', '').toLowerCase();
/// A name to show over someone's head: letters, numbers, spaces, apostrophes and hyphens, at most 14 of them.
export function cleanName(s) { return String(s || '').replace(/[^\p{L}\p{N} '-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 14); }

let lib = null;
function loadLib() {
  if (window.peerjs) return Promise.resolve(window.peerjs);
  if (!lib) lib = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = LIB; s.async = true; s.crossOrigin = 'anonymous';
    s.onload = () => (window.peerjs ? res(window.peerjs) : rej(fail('nolib')));
    s.onerror = () => { lib = null; rej(fail('nolib')); };
    document.head.appendChild(s);
  });
  return lib;
}
/// Which introducing server: the free public one, or (for testing only) a PeerServer on this computer: ?peer=127.0.0.1:9000
function server() {
  const at = new URLSearchParams(location.search).get('peer');
  if (at) {
    const [host, port] = at.split(':');
    if (host === '127.0.0.1' || host === 'localhost') return { host, port: Number(port) || 9000, path: '/', secure: false, debug: 1 };
  }
  return { debug: 1 };
}
function fail(code, detail) { const e = new Error(detail || code); e.code = code; return e; }
const within = (ms, promise, code) => Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(fail(code)), ms))]);

/// One open line to another computer: whole messages in and out, however long.
function line(conn, onMessage) {
  const parts = new Map();
  let next = 1;
  conn.on('data', (d) => {
    if (typeof d !== 'string') return;
    if (d[0] === '~') {   // a piece of a long message: ~id|piece|pieces|text
      const a = d.indexOf('|'), b = d.indexOf('|', a + 1), c = d.indexOf('|', b + 1);
      if (a < 0 || b < 0 || c < 0) return;
      const id = d.slice(1, a), i = Number(d.slice(a + 1, b)), n = Number(d.slice(b + 1, c));
      if (!(n > 0 && n < 4000 && i >= 0 && i < n)) return;
      let p = parts.get(id);
      if (!p) { p = { got: 0, bits: new Array(n) }; parts.set(id, p); }
      if (p.bits[i] === undefined) { p.bits[i] = d.slice(c + 1); p.got++; }
      if (p.got < n) return;
      parts.delete(id);
      d = p.bits.join('');
    }
    let m = null;
    try { m = JSON.parse(d); } catch (_) { return; }
    if (m && typeof m === 'object' && typeof m.t === 'string') onMessage(m);
  });
  return {
    send(m) {
      if (!conn.open) return false;
      const s = JSON.stringify(m);
      try {
        if (s.length <= PIECE) conn.send(s);
        else {
          const id = (next++).toString(36), n = Math.ceil(s.length / PIECE);
          for (let i = 0; i < n; i++) conn.send(`~${id}|${i}|${n}|${s.slice(i * PIECE, (i + 1) * PIECE)}`);
        }
      } catch (_) { return false; }
      return true;
    },
  };
}

/// `on` = { request(guest), joined(guest), left(guest, why), message(from, msg), lost(why), status(text) }.
/// On the host, `from` is the guest; on a guest, it is null (everything a guest hears comes from the host).
export function createNet(on) {
  const net = {
    role: null,          // null, 'host' or 'guest'
    code: null,          // the host's code, e.g. 'FOX-27'
    guests: new Map(),   // (host) number → { id, name, state: 'asking' | 'in', line, conn, heard }
    host, join, answer, send, to, all, kick, stop,
  };
  let peer = null, hostLine = null, hostConn = null, heard = 0, nextId = 1, watch = 0;

  // A guest pings the host every few seconds and the host answers at once, so each side knows the other is still there
  // (the answer doesn't wait for a timer: a host whose tab is in the background still replies straight away).
  function keepWatch() {
    clearInterval(watch);
    let last = performance.now();
    watch = setInterval(() => {
      const now = performance.now(), late = now - last > PING * 3;
      last = now;
      // This page was busy (building the world) or asleep in a background tab: it's this computer that went quiet,
      // so give the others a moment to be heard before judging.
      if (late) { for (const g of net.guests.values()) g.heard = Math.max(g.heard, now - PING); heard = Math.max(heard, now - PING); }
      if (net.role === 'host') {
        for (const g of [...net.guests.values()]) if (now - g.heard > (g.ready ? QUIET : QUIET_LOADING)) drop(g, 'lost');
      } else if (net.role === 'guest' && hostLine) {
        if (now - heard > QUIET) end('lost');
        else hostLine.send({ t: 'ping' });
      }
    }, PING);
  }

  // ----- hosting -----
  async function host(name) {
    if (net.role) return net.code;
    const peerjs = await loadLib();
    let lastErr = null;
    for (let tries = 0; tries < 6; tries++) {
      const code = newCode();
      const p = new peerjs.Peer(idOf(code), server());
      const res = await within(15000, new Promise((ok) => {
        p.on('open', () => ok('open'));
        p.on('error', (e) => ok(e && e.type === 'unavailable-id' ? 'taken' : e));
      }), 'noserver').catch((e) => e);
      if (res === 'open') {
        peer = p; net.role = 'host'; net.code = code; net.name = name;
        p.on('connection', arrive);
        p.on('error', (e) => { if (e && (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error')) on.status?.('reconnecting'); });
        // Lost touch with the introducing server (not with the friends already here): ask it again for the same code.
        p.on('disconnected', () => { if (net.role === 'host' && peer === p) setTimeout(() => { try { if (!p.destroyed) p.reconnect(); } catch (_) { /* gone */ } }, 2000); });
        keepWatch();
        return code;
      }
      try { p.destroy(); } catch (_) { /* never opened */ }
      if (res !== 'taken') { lastErr = res; break; }
    }
    throw lastErr && lastErr.code ? lastErr : fail(lastErr && lastErr.type === 'browser-incompatible' ? 'nowebrtc' : 'noserver');
  }
  function arrive(conn) {
    const g = { id: nextId++, name: cleanName(conn.metadata && conn.metadata.name) || 'A friend', state: 'new', conn, heard: performance.now(), line: null };
    conn.on('open', () => {
      g.line = line(conn, (m) => {
        g.heard = performance.now();
        if (m.t === 'ping') { g.line.send({ t: 'pong' }); return; }
        if (g.state === 'new') {
          if (m.t !== 'hello') return;
          g.name = cleanName(m.name) || g.name; g.hello = m;
          if ([...net.guests.values()].filter((o) => o.state === 'in' || o.state === 'asking').length >= MAX_GUESTS) { g.line.send({ t: 'no', why: 'full' }); g.state = 'gone'; setTimeout(() => conn.close(), 600); return; }
          g.state = 'asking';
          net.guests.set(g.id, g);
          g.line.send({ t: 'wait', host: net.name });
          on.request?.(g);
          return;
        }
        if (m.t === 'bye') { drop(g, 'left'); return; }
        if (g.state === 'in') { if (m.t === 'p') g.ready = true; on.message?.(g, m); }   // (moving about: built and playing)
      });
    });
    conn.on('close', () => drop(g, 'left'));
    conn.on('error', () => drop(g, 'lost'));
    // Someone who connects but never says hello (an old copy of the game, say) is let go.
    setTimeout(() => { if (g.state === 'new') { g.state = 'gone'; try { conn.close(); } catch (_) { /* gone */ } } }, 20000);
  }
  /// The host's answer to someone knocking: let them in, or not (`why`: 'notnow', 'version' or 'busy').
  function answer(id, yes, why = 'notnow', extra) {
    const g = net.guests.get(id);
    if (!g || g.state !== 'asking') return false;
    if (!yes) { g.line.send({ t: 'no', why, ...extra }); net.guests.delete(id); g.state = 'gone'; setTimeout(() => { try { g.conn.close(); } catch (_) { /* gone */ } }, 600); return false; }
    g.state = 'in';
    on.joined?.(g);
    return true;
  }
  function drop(g, why) {
    if (g.state === 'gone') return;
    const was = g.state;
    g.state = 'gone';
    net.guests.delete(g.id);
    try { g.conn.close(); } catch (_) { /* already shut */ }
    if (was === 'in' || was === 'asking') on.left?.(g, why);
  }
  function to(id, m) { const g = net.guests.get(id); return !!(g && g.state === 'in' && g.line && g.line.send(m)); }
  function all(m, except) { for (const g of net.guests.values()) if (g.state === 'in' && g.id !== except) g.line.send(m); }
  function kick(id) { const g = net.guests.get(id); if (!g) return; g.line?.send({ t: 'bye', why: 'home' }); setTimeout(() => drop(g, 'home'), 400); }

  // ----- joining -----
  async function join(code, name, hello) {
    if (net.role) throw fail('busy');
    const peerjs = await loadLib();
    if (!(peerjs.util && peerjs.util.supports && peerjs.util.supports.data)) throw fail('nowebrtc');
    const p = new peerjs.Peer(server());
    peer = p;
    let failWith = null;
    // (Once in, trouble with the introducing server doesn't matter: the two computers talk directly. Only the line to
    // the host closing, or the host going quiet, ends the visit.)
    p.on('error', (e) => { if (!hostLine) failWith = !e ? 'failed' : e.type === 'peer-unavailable' ? 'nobody' : e.type === 'browser-incompatible' ? 'nowebrtc' : e.type === 'webrtc' ? 'failed' : 'noserver'; });
    try {
      await within(15000, new Promise((ok, no) => { p.on('open', ok); p.on('error', () => no(fail(failWith || 'noserver'))); }), 'noserver');
      const conn = p.connect(idOf(code), { reliable: true, serialization: 'raw', metadata: { name } });
      await within(25000, new Promise((ok, no) => {
        conn.on('open', ok);
        conn.on('error', () => no(fail('failed')));
        p.on('error', () => no(fail(failWith || 'failed')));
      }), 'failed');
      hostConn = conn; net.role = 'guest'; net.code = code; heard = performance.now();
      hostLine = line(conn, (m) => {
        heard = performance.now();
        if (m.t === 'pong' || m.t === 'ping') return;
        if (m.t === 'bye') { end(m.why === 'home' ? 'home' : 'closed'); return; }
        on.message?.(null, m);
      });
      conn.on('close', () => end('closed'));
      hostLine.send({ t: 'hello', name, ...hello });
      keepWatch();
    } catch (e) {
      try { p.destroy(); } catch (_) { /* never opened */ }
      peer = null;
      throw e.code ? (e.code === 'failed' && failWith ? fail(failWith) : e) : fail(failWith || 'failed');
    }
  }
  function send(m) { return !!(hostLine && hostLine.send(m)); }
  function end(why) {
    if (net.role !== 'guest') return;
    stop(true);
    on.lost?.(why);
  }

  /// Stop playing together: tell everyone, then hang up.
  function stop(quiet) {
    clearInterval(watch);
    if (net.role === 'host') { for (const g of [...net.guests.values()]) { g.line?.send({ t: 'bye', why: 'closed' }); drop(g, 'closed'); } }
    else if (net.role === 'guest' && !quiet) hostLine?.send({ t: 'bye' });
    const p = peer;
    peer = null; hostLine = null; net.role = null; net.code = null;
    try { hostConn?.close(); } catch (_) { /* shut */ }
    hostConn = null;
    if (p) setTimeout(() => { try { p.destroy(); } catch (_) { /* gone */ } }, 300);
  }
  addEventListener('pagehide', () => { if (net.role) stop(); });
  return net;
}
