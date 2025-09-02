const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const output = fs.createWriteStream(path.join(__dirname, 'prodRelease', 'mjtest-prod.zip'));
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', function() {
  console.log(archive.pointer() + ' total bytes');
  console.log('mjtest-prod.zip created in prodRelease folder');
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// Add dist folder
archive.directory(path.join(__dirname, 'dist'), 'dist');
// Add mongoose.exe
archive.file(path.join(__dirname, 'prodRelease', 'mongoose.exe'), { name: 'mongoose.exe' });
// Add start.bat
archive.file(path.join(__dirname, 'prodRelease', 'start.bat'), { name: 'start.bat' });

archive.finalize();
