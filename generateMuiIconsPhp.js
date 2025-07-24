const MuiIcons = require('@mui/icons-material');
const fs = require('fs');
const path = require('path');

const iconNames = Object.keys(MuiIcons);

const phpContent = `<?php

return [
${iconNames.map(name => `    '${name}',`).join('\n')}
];
`;

fs.writeFileSync(path.resolve(process.cwd(), 'mui-icons.php'), phpContent);

console.log('Fișierul config/mui-icons.php a fost generat cu succes!');
