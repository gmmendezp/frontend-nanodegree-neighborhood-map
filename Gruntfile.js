module.exports = function (grunt) {

  grunt.initConfig({

    /* Project server */
    connect: {
      server: {
        options: {
          port: '8000',
          livereload: true,
          hostname: 'localhost',
          middleware: function (connect, options, middleware) {
            middleware.unshift(require('connect-livereload')());
            return middleware;
          }
        }
      }
    },

    /* Live reload server */
    watch: {
      options:{
        livereload: true
      },
      server: {
        files: [
          'css/*.css',
          'js/*.js',
          '*.html',
          'Gruntfile.js',
          'img/*'
        ]
      }
    }
  });

  /* Create the `serve` task */
  grunt.registerTask('server',[
    'connect',
    'watch'
  ]);

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
};
