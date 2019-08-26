const gulp = require('gulp');
const babel = require('gulp-babel');
const fs = require('fs');

gulp.task('transpile', () =>
    gulp.src(['./index.js', './commands/*', './config/*', './helpers/*', './utils/*'], { base: '.' })
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(gulp.dest('dist'))
);

gulp.task('copy-package-json', async () => {

    const { deserializeJsonFile } = require('./helpers/deserialize-object-from-file');
    const fileContent = await deserializeJsonFile('package.json');
    delete fileContent.devDependencies;
    delete fileContent.pkg;
    delete fileContent.nyc;
    fileContent.scripts = { test: 'echo "Error: no test specified" && exit 1' };
    fileContent.bin = { mdb: 'index.js' };
    fs.writeFileSync('dist/package.json', JSON.stringify(fileContent, false, 2));
});

gulp.task('copy-env-file', async () => fs.copyFileSync('./.env', './dist/.env'));

gulp.task('build', gulp.series('transpile', 'copy-package-json', 'copy-env-file'));
