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
