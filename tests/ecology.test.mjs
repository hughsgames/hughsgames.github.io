import {test} from 'node:test';
import assert from 'node:assert/strict';
import {huntingTarget} from '../polis-world/ecology.js';
test('predators choose reachable prey and leave tamed hunters peaceful',()=>{
 const lion={kind:'lion',x:0,y:0,z:0};
 const sheep={kind:'sheep',x:4,y:0,z:0};
 assert.equal(huntingTarget(lion,[sheep],null),sheep);
 assert.equal(huntingTarget({...lion,tame:true},[sheep],null),null);
 assert.equal(huntingTarget(lion,[{...sheep,y:20}],null),null);
});
test('a nearby player is a target, dead prey and riders are excluded',()=>{
 const lion={kind:'tiger',x:0,y:0,z:0},p={x:2,y:0,z:0};
 assert.equal(huntingTarget(lion,[],p),p);
 assert.equal(huntingTarget(lion,[{kind:'sheep',x:1,y:0,z:0,dead:true}],null),null);
 assert.equal(huntingTarget(lion,[{kind:'sheep',x:1,y:0,z:0,ridden:true}],null),null);
});
test('walls block prey selection and bites; an open doorway permits them', async () => {
 const {clearHuntPath}=await import('../polis-world/ecology.js');
 const a={kind:'wolf',x:0.5,y:2,z:0.5}, b={kind:'sheep',x:2.5,y:2,z:0.5};
 const wall=(x,y,z)=>x===1 && y===2 && z===0;
 assert.equal(huntingTarget(a,[b],null,wall),null);
 assert.equal(clearHuntPath(a,b,wall),false);
 assert.equal(huntingTarget(a,[b],null,()=>false),b);
 assert.equal(clearHuntPath(a,{...b,x:NaN}),false);
});
test('pets and protected herds are not prey; nearest visible wild prey wins',()=>{
 const a={kind:'lion',x:0.5,y:2,z:0.5};
 const pet={kind:'sheep',x:1,y:2,z:0.5,tame:true};
 const pen={...pet,tame:false,protected:true};
 const wild={kind:'gazelle',x:5,y:2,z:0.5};
 assert.equal(huntingTarget(a,[pet,pen,wild],null),wild);
});
