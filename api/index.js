// ==========================================
// ENTERPRISE ADVANCED DATABASE BACKEND CORE
// ==========================================
const { URL } = require('url');
const crypto = require('crypto');
let mysql = null;

try {
  mysql = require('mysql2/promise');
} catch (e) {
  console.log("Database driver layer loading in standard cloud memory sandbox fallback mode.");
}

const SECRET = process.env.JWT_SECRET || 'CYBER_SECURITY_KERNEL_CORE_3001';
const dbUrl = process.env.DATABASE_URL;

let pool = null;
let isMySQL = false;

// Initialize Resilient Database Connection Pool with Error 2026 Mitigations
if (dbUrl && mysql) {
  try {
    pool = mysql.createPool({
      uri: dbUrl,
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    isMySQL = true;
    console.log("Successfully targeted and locked into Railway MySQL Infrastructure.");
  } catch (err) {
    console.error("Pool allocation failure. Dropping to in-memory safe cluster sandbox.", err);
  }
}

// In-Memory Backup Failover Sandbox (Activated if DATABASE_URL is unprovided)
let memorySandbox = {
  users: [{ id: "U-1337", name: "Aman Prasad", email: "aman@library.online", role: "Admin", wallet: 1000, joined: "2026-01-15", passHash: crypto.createHash('sha256').update('aman').digest('hex') }],
  books: [{ isbn: "978-0132350884", title: "Clean Code: A Handbook of Agile Software Craftsmanship", author: "Robert C. Martin", genre: "Tech", shelf: "Rack A-1", price: 650, pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" }],
  copies: [{ id: "ACC-1001", isbn: "978-0132350884", status: "AV", condition: "Excellent" }],
  txns: [], reservations: [], ledger: [], logs: [], settings: { name: "Aman's Hyperion Library", days: 14, fine: 10 }
};
if (!global.globalDbEngine) { global.globalDbEngine = memorySandbox; } else { memorySandbox = global.globalDbEngine; }

// Automated Isolated Infrastructure Table Setup
async function ensureDatabaseSchema() {
  if (!isMySQL) return;
  const connection = await pool.getConnection();
  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS hyperion_settings (id INT PRIMARY KEY, name VARCHAR(255), days INT, fine INT)`);
    await connection.query(`INSERT IGNORE INTO hyperion_settings (id, name, days, fine) VALUES (1, "Aman's Hyperion Library", 14, 10)`);
    await connection.query(`CREATE TABLE IF NOT EXISTS hyperion_users (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255), email VARCHAR(255) UNIQUE, role VARCHAR(50), wallet INT, joined VARCHAR(50), passHash VARCHAR(255))`);
    await connection.query(`INSERT IGNORE INTO hyperion_users VALUES ('U-1337', 'Aman Prasad', 'aman@library.online', 'Admin', 1000, '2026-01-15', '${crypto.createHash('sha256').update('aman').digest('hex')}')`);
    await connection.query(`CREATE TABLE IF NOT EXISTS hyperion_books (isbn VARCHAR(50) PRIMARY KEY, title VARCHAR(255), author VARCHAR(255), genre VARCHAR(100), shelf VARCHAR(100), price INT, pdfUrl TEXT)`);
    await connection.query(`INSERT IGNORE INTO hyperion_books VALUES ('978-0132350884', 'Clean Code', 'Robert C. Martin', 'Tech', 'Rack A-1', 650, 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')`);
    await connection.query(`CREATE TABLE IF NOT EXISTS hyperion_copies (id VARCHAR(50) PRIMARY KEY, isbn VARCHAR(50), status VARCHAR(50), \`condition\` VARCHAR(50))`);
    await connection.query(`INSERT IGNORE INTO hyperion_copies VALUES ('ACC-1001', '978-0132350884', 'AV', 'Excellent')`);
    await connection.query(`CREATE TABLE IF NOT EXISTS hyperion_txns (id VARCHAR(50) PRIMARY KEY, copyId VARCHAR(50), isbn VARCHAR(50), userId VARCHAR(50), userName VARCHAR(255), issueDate VARCHAR(50), dueDate VARCHAR(50), returnDate VARCHAR(50), status VARCHAR(50), fine INT, paid INT)`);
    await connection.query(`CREATE TABLE IF NOT EXISTS hyperion_reservations (id VARCHAR(50) PRIMARY KEY, date VARCHAR(50), userId VARCHAR(50), userName VARCHAR(255), isbn VARCHAR(50), title VARCHAR(255), status VARCHAR(50))`);
    await connection.query(`CREATE TABLE IF NOT EXISTS hyperion_ledger (id INT AUTO_INCREMENT PRIMARY KEY, date VARCHAR(50), type VARCHAR(100), \`desc\` TEXT, amt INT)`);
    await connection.query(`CREATE TABLE IF NOT EXISTS hyperion_logs (id INT AUTO_INCREMENT PRIMARY KEY, timestamp VARCHAR(100), type VARCHAR(100), message TEXT)`);
  } finally {
    connection.release();
  }
}

async function logAction(type, message) {
  const ts = new Date().toISOString();
  if (isMySQL) {
    await pool.query(`INSERT INTO hyperion_logs (timestamp, type, message) VALUES (?, ?, ?)`, [ts, type, message]);
  } else {
    memorySandbox.logs.unshift({ timestamp: ts, type, message });
    if (memorySandbox.logs.length > 100) memorySandbox.logs.pop();
  }
}

// Token Engine Matrices
function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 86400000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  try {
    const [header, body, signature] = token.split('.');
    const computedSig = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
    if (computedSig !== signature) return null;
    const decodedBody = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (Date.now() > decodedBody.exp) return null;
    return decodedBody;
  } catch (err) { return null; }
}

// Serverless Gateway Routing Framework
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.statusCode = 200; return res.end(); }

  await ensureDatabaseSchema();

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const path = parsedUrl.pathname;
  
  let body = '';
  await new Promise((resolve) => {
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => resolve());
  });
  
  let jsonPayload = {};
  if (body) { try { jsonPayload = JSON.parse(body); } catch(e) {} }

  let authUser = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    authUser = verifyToken(authHeader.split(' ')[1]);
  }

  res.setHeader('Content-Type', 'application/json');

  try {
    // ------------------------------------------
    // AUTH ROUTINES
    // ------------------------------------------
    if (path === '/api/auth/register' && req.method === 'POST') {
      const { name, email, password, role } = jsonPayload;
      const passHash = crypto.createHash('sha256').update(password || '').digest('hex');
      const id = "U-" + Math.floor(1000 + Math.random() * 9000);
      const joined = new Date().toISOString().split('T')[0];

      if (isMySQL) {
        const [existing] = await pool.query(`SELECT * FROM hyperion_users WHERE email = ?`, [email]);
        if (existing.length > 0) { res.statusCode = 400; return res.end(JSON.stringify({ error: "Collision detected" })); }
        await pool.query(`INSERT INTO hyperion_users VALUES (?, ?, ?, ?, 0, ?, ?)`, [id, name, email, role || 'Student', joined, passHash]);
      } else {
        if (memorySandbox.users.find(u => u.email === email)) { res.statusCode = 400; return res.end(JSON.stringify({ error: "Collision detected" })); }
        memorySandbox.users.push({ id, name, email, role: role || 'Student', wallet: 0, joined, passHash });
      }
      await logAction("SECURITY", `Registered node payload cluster: ${email}`);
      return res.end(JSON.stringify({ token: signToken({ id, email, role }), user: { id, name, email, role, wallet: 0 } }));
    }

    if (path === '/api/auth/login' && req.method === 'POST') {
      const { email, password } = jsonPayload;
      const targetHash = crypto.createHash('sha256').update(password || '').digest('hex');
      let user = null;

      if (isMySQL) {
        const [rows] = await pool.query(`SELECT * FROM hyperion_users WHERE email = ? AND passHash = ?`, [email, targetHash]);
        if (rows.length > 0) user = rows[0];
      } else {
        user = memorySandbox.users.find(u => u.email === email && u.passHash === targetHash);
      }

      if (!user) { res.statusCode = 401; return res.end(JSON.stringify({ error: "Invalid signatures" })); }
      await logAction("AUTH", `Verified token login pass sequence: ${email}`);
      return res.end(JSON.stringify({ token: signToken({ id: user.id, email: user.email, role: user.role }), user: { id: user.id, name: user.name, email: user.email, role: user.role, wallet: user.wallet } }));
    }

    // ------------------------------------------
    // DATA LAYER SYNCHRONIZATION OVERRIDES
    // ------------------------------------------
    if (path === '/api/sync' && req.method === 'GET') {
      if (isMySQL) {
        const [settings] = await pool.query(`SELECT * FROM hyperion_settings WHERE id = 1`);
        const [users] = await pool.query(`SELECT id, name, email, role, wallet, joined FROM hyperion_users`);
        const [books] = await pool.query(`SELECT * FROM hyperion_books`);
        const [copies] = await pool.query(`SELECT * FROM hyperion_copies`);
        const [txns] = await pool.query(`SELECT * FROM hyperion_txns`);
        const [reservations] = await pool.query(`SELECT * FROM hyperion_reservations`);
        const [ledger] = await pool.query(`SELECT * FROM hyperion_ledger ORDER BY id DESC LIMIT 50`);
        const [logs] = await pool.query(`SELECT * FROM hyperion_logs ORDER BY id DESC LIMIT 50`);
        
        // Calculate dynamic real-time overdue intervals across active vectors
        const today = new Date();
        txns.forEach(t => {
          if (t.status === 'OPEN' && new Date(t.dueDate) < today) {
            const delta = Math.floor((today - new Date(t.dueDate)) / (1000 * 60 * 60 * 24));
            t.fine = delta * settings[0].fine;
          }
        });

        return res.end(JSON.stringify({ settings: settings[0], users, books, copies, txns, reservations, ledger, logs }));
      } else {
        return res.end(JSON.stringify(memorySandbox));
      }
    }

    if (!authUser) { res.statusCode = 403; return res.end(JSON.stringify({ error: "Signature token missing" })); }

    // ------------------------------------------
    // CATALOG MANAGEMENT INJECTS
    // ------------------------------------------
    if (path === '/api/books' && req.method === 'POST') {
      const { isbn, title, author, genre, shelf, price, pdfUrl, initialCopies } = jsonPayload;
      if (isMySQL) {
        await pool.query(`REPLACE INTO hyperion_books VALUES (?, ?, ?, ?, ?, ?, ?)`, [isbn, title, author, genre, shelf, Number(price), pdfUrl]);
        if (initialCopies > 0) {
          for(let i=0; i<Number(initialCopies); i++) {
            const cid = "ACC-" + Math.floor(10000 + Math.random() * 90000);
            await pool.query(`INSERT INTO hyperion_copies VALUES (?, ?, 'AV', 'Excellent')`, [cid, isbn]);
          }
        }
      } else {
        const existing = memorySandbox.books.find(b => b.isbn === isbn);
        if (existing) {
          Object.assign(existing, { title, author, genre, shelf, price: Number(price), pdfUrl });
        } else {
          memorySandbox.books.push({ isbn, title, author, genre, shelf, price: Number(price), pdfUrl });
          for(let i=0; i<(Number(initialCopies)||1); i++) {
            memorySandbox.copies.push({ id: "ACC-"+Math.floor(10000+Math.random()*90000), isbn, status: "AV", condition: "Excellent" });
          }
        }
      }
      await logAction("CATALOG", `Mutated master asset payload array index for: ${title}`);
      return res.end(JSON.stringify({ success: true }));
    }

    if (path === '/api/books/add-copy' && req.method === 'POST') {
      const { isbn } = jsonPayload;
      const cid = "ACC-" + Math.floor(10000 + Math.random() * 90000);
      if (isMySQL) {
        await pool.query(`INSERT INTO hyperion_copies VALUES (?, ?, 'AV', 'Excellent')`, [cid, isbn]);
      } else {
        memorySandbox.copies.push({ id: cid, isbn, status: "AV", condition: "Excellent" });
      }
      await logAction("CATALOG", `Allocated copy tracking element: ${cid}`);
      return res.end(JSON.stringify({ success: true }));
    }

    // ------------------------------------------
    // CIRCULATION ROUTINES
    // ------------------------------------------
    if (path === '/api/circulation/issue' && req.method === 'POST') {
      const { userId, copyId, durationDays } = jsonPayload;
      const txid = "TX-" + Math.floor(10000 + Math.random() * 90000);
      const issueDate = new Date().toISOString().split('T')[0];
      const due = new Date(); due.setDate(due.getDate() + Number(durationDays));
      const dueDate = due.toISOString().split('T')[0];

      if (isMySQL) {
        const [users] = await pool.query(`SELECT name FROM hyperion_users WHERE id = ?`, [userId]);
        const [copies] = await pool.query(`SELECT status, isbn FROM hyperion_copies WHERE id = ?`, [copyId]);
        if (users.length === 0 || copies.length === 0 || copies[0].status !== 'AV') { res.statusCode = 400; return res.end(JSON.stringify({ error: "Asset locked or configuration parameters bad" })); }
        
        await pool.query(`UPDATE hyperion_copies SET status = 'OUT' WHERE id = ?`, [copyId]);
        await pool.query(`INSERT INTO hyperion_txns VALUES (?, ?, ?, ?, ?, ?, ?, '', 'OPEN', 0, 0)`, [txid, copyId, copies[0].isbn, userId, users[0].name, issueDate, dueDate]);
      } else {
        const user = memorySandbox.users.find(u => u.id === userId);
        const copy = memorySandbox.copies.find(c => c.id === copyId);
        if (!user || !copy || copy.status !== 'AV') { res.statusCode = 400; return res.end(JSON.stringify({ error: "Asset locked" })); }
        copy.status = 'OUT';
        memorySandbox.txns.push({ id: txid, copyId, isbn: copy.isbn, userId, userName: user.name, issueDate, dueDate, returnDate: '', status: 'OPEN', fine: 0, paid: 0 });
      }
      await logAction("CIRCULATION", `Dispatched tracking channel sequence allocation ${copyId} targeting vector recipient.`);
      return res.end(JSON.stringify({ success: true }));
    }

    if (path === '/api/circulation/return' && req.method === 'POST') {
      const { copyId, condition, paymentCollected } = jsonPayload;
      const todayStr = new Date().toISOString().split('T')[0];

      if (isMySQL) {
        const [txs] = await pool.query(`SELECT * FROM hyperion_txns WHERE copyId = ? AND status = 'OPEN'`, [copyId]);
        if (txs.length === 0) { res.statusCode = 400; return res.end(JSON.stringify({ error: "No open transactional vector path traced" })); }
        
        const nextStatus = condition === 'Lost' ? 'LOST' : 'AV';
        await pool.query(`UPDATE hyperion_copies SET status = ?, \`condition\` = ? WHERE id = ?`, [nextStatus, condition, copyId]);
        await pool.query(`UPDATE hyperion_txns SET status = 'CLOSED', returnDate = ?, paid = ? WHERE id = ?`, [todayStr, Number(paymentCollected)||0, txs[0].id]);
        if (Number(paymentCollected) > 0) {
          await pool.query(`INSERT INTO hyperion_ledger (date, type, \`desc\`, amt) VALUES (?, 'FINE_COLLECTION', ?, ?)`, [todayStr, `Fine clearance for copy asset node ${copyId}`, Number(paymentCollected)]);
        }
      } else {
        const txn = memorySandbox.txns.find(t => t.copyId === copyId && t.status === 'OPEN');
        const copy = memorySandbox.copies.find(c => c.id === copyId);
        if (!txn || !copy) { res.statusCode = 400; return res.end(JSON.stringify({ error: "No asset trace mapped" })); }
        txn.status = 'CLOSED'; txn.returnDate = todayStr; txn.paid = Number(paymentCollected) || 0;
        if (condition === 'Lost') { copy.status = 'LOST'; } else { copy.status = 'AV'; copy.condition = condition; }
        if (Number(paymentCollected) > 0) memorySandbox.ledger.push({ date: todayStr, type: 'FINE_COLLECTION', desc: `Fine clear copy node ${copyId}`, amt: Number(paymentCollected) });
      }
      await logAction("CIRCULATION", `Re-vectorized core platform cluster coordinate asset trace elements for copy: ${copyId}`);
      return res.end(JSON.stringify({ success: true }));
    }

    // ------------------------------------------
    // FINANCES
    // ------------------------------------------
    if (path === '/api/finance/wallet-refill' && req.method === 'POST') {
      const { amount } = jsonPayload;
      const todayStr = new Date().toISOString().split('T')[0];
      if (isMySQL) {
        await pool.query(`UPDATE hyperion_users SET wallet = wallet + ? WHERE id = ?`, [Number(amount), authUser.id]);
        await pool.query(`INSERT INTO hyperion_ledger (date, type, \`desc\`, amt) VALUES (?, 'CREDIT_DEPOSIT', ?, ?)`, [todayStr, `Refilled account wallet for node identity user ${authUser.email}`, Number(amount)]);
      } else {
        const user = memorySandbox.users.find(u => u.id === authUser.id);
        if(user) user.wallet += Number(amount);
        memorySandbox.ledger.push({ date: todayStr, type: 'CREDIT_DEPOSIT', desc: `Refilled identity node wallet ${authUser.email}`, amt: Number(amount) });
      }
      await logAction("FINANCE", `Injected dynamic balance allocation tokens to node: ${authUser.id}`);
      return res.end(JSON.stringify({ success: true }));
    }

    res.statusCode = 404; return res.end(JSON.stringify({ error: "Endpoint trace missing" }));
  } catch (err) {
    res.statusCode = 500; return res.end(JSON.stringify({ error: "Kernel exception fault", details: err.message }));
  }
};
