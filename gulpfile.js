const gulp = require('gulp');
const babel = require('gulp-babel');

gulp.task('transpile', () =>
    gulp.src(['./index.js', './commands/*', './config/*', './helpers/*', './utils/*'], { base: '.' })
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(gulp.dest('dist'))
);
