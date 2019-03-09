const gulp = require("gulp");
const ts = require("gulp-typescript");
const watchify = require("watchify");
const concat = require("gulp-concat");
const scss = require("gulp-sass");
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const tsify = require("tsify");
const del = require("del");
const imagemin = require("gulp-imagemin");
const uglify = require("gulp-uglify");
const sourcemaps = require("gulp-sourcemaps");
const buffer = require("vinyl-buffer");
const rename = require("gulp-rename");
const browserSync = require("browser-sync").create();
const reload = browserSync.reload;

const tsProject = ts.createProject("./tsconfig.json");
const destDir = "dist";
let paths = {
  static: ["src/*.html", "src/favicon.png", "src/manifest.json"],
  scripts: {
    src: "src/**/*.ts",
    entry: "src/app/main.ts",
    vendor: "src/vendor/**/*",
    vendorDest: `${destDir}/vendor/`,
    bundleJsName: "js/bundle.js",
    bundleJsDest: `${destDir}/js/`,
  },
  images: {
    src: "src/assets/**/*",
    dest: `${destDir}/assets/`
  },
  styles: {
    src: "src/scss/**/*.scss",
    css: "src/styles/**/*",
    dest: `${destDir}/styles/`
  },
  del: {
    src: `dist`
  }
};

let watchedBrowserify = watchify(
  browserify({
    basedir: ".",
    debug: true,
    entries: [paths.scripts.entry],
    cache: {},
    packageCache: {}
  }).plugin(tsify)
);
function bundle() {
  return (
    browserify({
      basedir: ".",
      debug: true,
      entries: [paths.scripts.entry],
      cache: {},
      packageCache: {}
    })
      .plugin(tsify)
      .transform("babelify", {
        presets: ["es2015"],
        extensions: [".ts"]
      })
      .bundle()
      .pipe(source(paths.scripts.bundleJsName))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write("./"))
      // .pipe(uglify())
      .pipe(gulp.dest(destDir))
  );
}
function clean(cb) {
  // You can use multiple globbing patterns as you would with `gulp.src`,
  // for example if you are using del 2.0 or above, return its promise
  return del([paths.del.src]);
}
function copyStatic() {
  return gulp.src(paths.static).pipe(gulp.dest(destDir));
}
function copyStyle() {
  return gulp.src(paths.styles.css).pipe(gulp.dest(paths.styles.dest));
}
function copyJsVendor() {
  return gulp
    .src(paths.scripts.vendor)
    .pipe(gulp.dest(paths.scripts.vendorDest));
}
function images() {
  return gulp
    .src(paths.images.src, { since: gulp.lastRun(images) })
    .pipe(imagemin({ optimizationLevel: 5 }))
    .pipe(gulp.dest(paths.images.dest));
}

function scssBuild() {
  return (
    gulp
      .src(paths.styles.src)
      .pipe(scss())
      // pass in options to the stream
      .pipe(
        rename({
          basename: "main",
          suffix: ".min"
        })
      )
      .pipe(gulp.dest(paths.styles.dest))
  );
}

function server(done) {
  browserSync.init({
    server: destDir,
    port: 8007,
    open: false
  });
  done();
}

function watch(done) {
  gulp.watch(paths.scripts.src, bundle);
  gulp.watch(paths.static, copyStatic);
  gulp.watch(paths.styles.src, scssBuild);
  gulp.watch(paths.styles.css, copyStyle);
  gulp.watch(paths.images.src, images);
  gulp.watch(paths.scripts.vendor, copyJsVendor);
  gulp.watch(destDir + "/**/*").on("change", reload);
  done();
}
//gulp.series|4.0 顺序执行
//gulp.parallel|4.0 并行
gulp.task(
  "default",
  gulp.series(
    server,
    clean,
    gulp.parallel(
      copyStatic,
      copyStyle,
      copyJsVendor,
      images,
      scssBuild,
      bundle
    ),
    watch
  )
);
