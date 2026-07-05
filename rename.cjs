const fs = require('fs');
const path = require('path');

const extensions = ['.js', '.jsx', '.html', '.css'];

function walkDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                walkDir(fullPath);
            }
        } else {
            if (extensions.includes(path.extname(fullPath))) {
                let content = fs.readFileSync(fullPath, 'utf8');
                let newContent = content
                    .replace(/DoThozhil/g, 'krewgrid')
                    .replace(/dothozhil/g, 'krewgrid');
                
                if (content !== newContent) {
                    fs.writeFileSync(fullPath, newContent, 'utf8');
                    console.log(`Updated: ${fullPath}`);
                }
            }
        }
    });
}

walkDir(__dirname);
