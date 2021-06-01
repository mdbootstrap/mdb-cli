const gulp = require('gulp');
const babel = require('gulp-babel');
const fs = require('fs');

gulp.task('transpile', () =>
    gulp.src(['./index.js', './context.js', './command-invoker.js', './commands/*', './config/*', './helpers/*', './models/*', './receivers/**/*', './utils/**/*'], { base: '.' })
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(gulp.dest('dist'))
);

gulp.task('copy-package-json', async () => {

    const { deserializeJsonFile } = require('./helpers/deserialize-json-file');
    const fileContent = await deserializeJsonFile('../package.json');
    delete fileContent.devDependencies;
    delete fileContent.pkg;
    delete fileContent.nyc;
    delete fileContent.scripts['test:coverage'];
    delete fileContent.scripts.compile;
    fileContent.scripts.test = 'echo "Error: no test specified" && exit 1';
    fileContent.bin.mdb = './index.js';
    fs.writeFileSync('dist/package.json', JSON.stringify(fileContent, null, 2));
});

gulp.task('copy-readme', async () => {

    try {

        fs.copyFileSync('../README.md', './dist/README.md');
    } catch (e) {

        if (e.code === 'ENOENT') {

            console.log('Either source or destination file does not exist, skipping...');
        } else {

            throw e;
        }
    }
});

gulp.task('copy-env', async () => {

    fs.copyFileSync('../.env', './dist/.env');
});

gulp.task('build', gulp.series('transpile', 'copy-package-json', 'copy-readme', 'copy-env'));
