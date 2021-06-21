const fs = require('fs');

deserializeJsonFile('./package.json').then(fileContent => {
    delete fileContent.devDependencies;
    delete fileContent.pkg;
    delete fileContent.nyc;
    delete fileContent.mocha;
    delete fileContent.scripts['test:coverage'];
    delete fileContent.scripts.compile;
    fileContent.scripts.test = 'echo "Error: no test specified" && exit 1';
    fileContent.bin.mdb = './index.js';
    fs.writeFileSync('dist/package.json', JSON.stringify(fileContent, null, 2));
}).catch(err => {
    console.error(err);
});

function deserializeJsonFile(filePath) {

    return new Promise((resolve, reject) => {

        fs.readFile(filePath, 'utf8', (error, content) => {

            if (error) {

                return reject(error);
            }

            try {

                const result = JSON.parse(content);

                resolve(result);

            } catch (err) {

                reject(err);
            }
        });
    });
}
