const fs = require('fs');

// 1. Modificar Login.jsx
let login = fs.readFileSync('frontend/src/components/Login.jsx', 'utf8');
login = login.replace(
    /login\(response\.data\.usuario\)/,
    "localStorage.setItem('token', response.data.token);\n                login(response.data.usuario)"
);
fs.writeFileSync('frontend/src/components/Login.jsx', login);

// 2. Modificar apiRoutes.js
let api = fs.readFileSync('frontend/src/api/apiRoutes.js', 'utf8');
api = api.replace(
    /axios\.interceptors\.request\.use\(\(config\) => \{/,
    `axios.interceptors.request.use((config) => {\n    const token = localStorage.getItem('token')\n    if (token) {\n        config.headers.Authorization = \`Bearer \${token}\`\n    }`
);
api = api.replace(
    /localStorage\.removeItem\('csrf_token'\)/,
    "localStorage.removeItem('csrf_token')\n                localStorage.removeItem('token')"
);
fs.writeFileSync('frontend/src/api/apiRoutes.js', api);

// 3. Modificar AuthContext.jsx
let auth = fs.readFileSync('frontend/src/context/AuthContext.jsx', 'utf8');
auth = auth.replace(
    /localStorage\.removeItem\('csrf_token'\)/,
    "localStorage.removeItem('csrf_token')\n        localStorage.removeItem('token')"
);
fs.writeFileSync('frontend/src/context/AuthContext.jsx', auth);
