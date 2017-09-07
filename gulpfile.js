var gulp          = require('gulp');
var notify        = require('gulp-notify');
var source        = require('vinyl-source-stream');
var browserify    = require('browserify');
var babelify      = require('babelify');
var ngAnnotate    = require('browserify-ngannotate');
var browserSync   = require('browser-sync').create();
var rename        = require('gulp-rename');
var templateCache = require('gulp-angular-templatecache');
var uglify        = require('gulp-uglify');
var merge         = require('merge-stream');

// File location
var jsFiles    = "app/js/**/*.js";
var htmlFiles  = "app/js/**/*.html";

var interceptErrors = function(error) {
    var args = Array.prototype.slice.call(arguments);

    // Pass error to notification center using gulp-notify
    notify.onError({
        title: 'Compilation Error',
        message: '<%= error.message %>'
    }).apply(this, args);

    // Avoid gulp hanging on this task
    this.emit('end');
};

gulp.task('browserify', ['views'], function() {
    return browserify('./app/js/app.js')
        .transform(babelify, {presets: ["es2015"]})
        .transform(ngAnnotate)
        .bundle()
        .on('error', interceptErrors)
        // Use a desired filename and pass it to vinyl-source-stream
        .pipe(source('bundle.js'))
        // Pipe streams to tasks!
        .pipe(gulp.dest('./build/'));
});

gulp.task('html', function() {
    return gulp.src("app/index.html")
        .on('error', interceptErrors)
        .pipe(gulp.dest('./build/'));
});

gulp.task('views', function() {
    return gulp.src(htmlFiles)
        .pipe(templateCache({
            standalone: true
        }))
        .on('error', interceptErrors)
        .pipe(rename("app.templates.js"))
        .pipe(gulp.dest('./app/js/config/'))
});

/**
 * Minify JS/CSS files and make app production ready
 */
gulp.task('build', ['html', 'browserify'], function() {
    var html = gulp.src("build/index.html")
                    .pipe(gulp.dest('./dist/'));

    var js = gulp.src("build/bundle.js")
                 .pipe(uglify())
                 .pipe(gulp.dest('./dist/'));
    
    return merge(html, js);
});

gulp.task('default', ['html', 'browserify'], function() {
    browserSync.init(['./build/**/**.**'], {
        server: './build',
        port: 4000,
        notify: false,
        ui: {
            port: 4001
        }
    });

    gulp.watch('app/index.html', ['html']);
    gulp.watch(htmlFiles, ['views']);
    gulp.watch(jsFiles, ['browserify']);
})
