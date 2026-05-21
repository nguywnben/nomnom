import bcrypt from 'bcrypt';

const password = process.argv[2] ?? 'password123';
const hash = await bcrypt.hash(password, 10);
const ok = await bcrypt.compare(password, hash);
console.log('hash:', hash);
console.log('verify:', ok);
