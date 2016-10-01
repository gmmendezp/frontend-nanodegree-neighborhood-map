module.exports = function (grunt) {

  grunt.initConfig({

    /* Clear out the directories if they exists */
    clean: {
      dist: {
        src: ['dist'],
      }
    },

    /* Generate the dist directory if it is missing */
    mkdir: {
      dist: {
        options: {
          create: ['dist']
        },
      },
    },

    /* Copy the files to dist folder */
    copy: {
      dist: {
        files: [{
          expand: true,
          cwd: 'src',
          src: [
            'vendor/*',
            'vendor/*/*',
            'vendor/*/*/*',
            'assets/*'],
          dest: 'dist'
        }]
      }
    },

    /* Minify JS files */
    uglify: {
      dist: {
        files: {
          'dist/js/app.js': ['src/js/app.js'],
        }
      }
    },

    /* Minify CSS files */
    cssmin: {
      dist: {
        files: [{
          expand: true,
          cwd: 'src/css',
          src: ['*.css'],
          dest: 'dist/css',
          ext: '.css'
        }]
      }
    },

    /* Minify HTML files */
    htmlmin: {
      dist: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: {
          'dist/index.html': 'src/index.html',
          'dist/info.html': 'src/info.html',
        }
      }
    },

    /* Project server */
    connect: {
      dist: {
        options: {
          port: '8000',
          hostname: 'localhost',
          keepalive: true,
          base: 'dist'
        }
      },
      src: {
        options: {
          port: '8000',
          hostname: 'localhost',
          keepalive: true,
          base: 'src'
        }
      }
    }
  });

  /* Create the `build` task */
  grunt.registerTask('build',[
    'clean',
    'mkdir',
    'copy',
    'uglify',
    'cssmin',
    'htmlmin'
  ]);

  /* Create the `server` task */
  grunt.registerTask('server',[
    'clean',
    'mkdir',
    'copy',
    'uglify',
    'cssmin',
    'htmlmin',
    'connect:dist'
  ]);
  /* Create the `dev` task */
  grunt.registerTask('dev',[
    'connect:src'
  ]);

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-inline');
  grunt.loadNpmTasks('grunt-mkdir');
};
