const gulp = require('gulp');
const babel = require('gulp-babel');

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
    delete fileContent.scripts['test:coverage'];
    delete fileContent.scripts.compile;
    fileContent.scripts.test = 'echo "Error: no test specified" && exit 1';
    require('fs').writeFileSync('dist/package.json', JSON.stringify(fileContent, false, 2));
});

gulp.task('build', gulp.series('transpile', 'copy-package-json'));
