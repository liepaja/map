// import test from '../setup';
// import {promisify, compressImage, loadImage} from '../../src';
// import fs from 'fs';
// import path from 'path';
// import mkdirp from 'mkdirp';

// const TEST_DIR = path.join(__dirname, '..', 'data');
// const TEST_FILE = path.join(TEST_DIR, 'test.png');

// const IMAGE = {
//   width: 2,
//   height: 3,
//   data: new Uint8Array([
//     255,
//     0,
//     0,
//     255,
//     0,
//     255,
//     255,
//     255,
//     0,
//     0,
//     255,
//     255,
//     255,
//     255,
//     0,
//     255,
//     0,
//     255,
//     0,
//     255,
//     255,
//     0,
//     255,
//     255
//   ])
// };

// Test that we can write and read an image, and that result is identical
// test('io#write-read-image', async function(t) {
//   await promisify(mkdirp)(TEST_DIR);
//   const file = fs.createWriteStream(TEST_FILE);
//   file.on('close', async function() {
//     const result = await loadImage(TEST_FILE);
//     t.same(result, IMAGE);
//     t.end();
//   });
//   compressImage(IMAGE).pipe(file);
// });
"use strict";
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy90ZXN0LXV0aWxzL2x1bWEuZ2wvaW8tZXh0ZW5kZWQvdGVzdC93cml0ZS1yZWFkLWltYWdlLnNwZWMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6IndyaXRlLXJlYWQtaW1hZ2Uuc3BlYy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGltcG9ydCB0ZXN0IGZyb20gJy4uL3NldHVwJztcbi8vIGltcG9ydCB7cHJvbWlzaWZ5LCBjb21wcmVzc0ltYWdlLCBsb2FkSW1hZ2V9IGZyb20gJy4uLy4uL3NyYyc7XG4vLyBpbXBvcnQgZnMgZnJvbSAnZnMnO1xuLy8gaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG4vLyBpbXBvcnQgbWtkaXJwIGZyb20gJ21rZGlycCc7XG5cbi8vIGNvbnN0IFRFU1RfRElSID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ2RhdGEnKTtcbi8vIGNvbnN0IFRFU1RfRklMRSA9IHBhdGguam9pbihURVNUX0RJUiwgJ3Rlc3QucG5nJyk7XG5cbi8vIGNvbnN0IElNQUdFID0ge1xuLy8gICB3aWR0aDogMixcbi8vICAgaGVpZ2h0OiAzLFxuLy8gICBkYXRhOiBuZXcgVWludDhBcnJheShbXG4vLyAgICAgMjU1LFxuLy8gICAgIDAsXG4vLyAgICAgMCxcbi8vICAgICAyNTUsXG4vLyAgICAgMCxcbi8vICAgICAyNTUsXG4vLyAgICAgMjU1LFxuLy8gICAgIDI1NSxcbi8vICAgICAwLFxuLy8gICAgIDAsXG4vLyAgICAgMjU1LFxuLy8gICAgIDI1NSxcbi8vICAgICAyNTUsXG4vLyAgICAgMjU1LFxuLy8gICAgIDAsXG4vLyAgICAgMjU1LFxuLy8gICAgIDAsXG4vLyAgICAgMjU1LFxuLy8gICAgIDAsXG4vLyAgICAgMjU1LFxuLy8gICAgIDI1NSxcbi8vICAgICAwLFxuLy8gICAgIDI1NSxcbi8vICAgICAyNTVcbi8vICAgXSlcbi8vIH07XG5cbi8vIFRlc3QgdGhhdCB3ZSBjYW4gd3JpdGUgYW5kIHJlYWQgYW4gaW1hZ2UsIGFuZCB0aGF0IHJlc3VsdCBpcyBpZGVudGljYWxcbi8vIHRlc3QoJ2lvI3dyaXRlLXJlYWQtaW1hZ2UnLCBhc3luYyBmdW5jdGlvbih0KSB7XG4vLyAgIGF3YWl0IHByb21pc2lmeShta2RpcnApKFRFU1RfRElSKTtcbi8vICAgY29uc3QgZmlsZSA9IGZzLmNyZWF0ZVdyaXRlU3RyZWFtKFRFU1RfRklMRSk7XG4vLyAgIGZpbGUub24oJ2Nsb3NlJywgYXN5bmMgZnVuY3Rpb24oKSB7XG4vLyAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbG9hZEltYWdlKFRFU1RfRklMRSk7XG4vLyAgICAgdC5zYW1lKHJlc3VsdCwgSU1BR0UpO1xuLy8gICAgIHQuZW5kKCk7XG4vLyAgIH0pO1xuLy8gICBjb21wcmVzc0ltYWdlKElNQUdFKS5waXBlKGZpbGUpO1xuLy8gfSk7XG4iXX0=