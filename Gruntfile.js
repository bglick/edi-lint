module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: ['build/_bower.js','src/*.js'],
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    copy: {
      main: {
        files: [
          {cwd:'src/', src: ['*.js'], dest: 'dist/', flatten: true, expand: true},
          {cwd:'src/', src: ['*.html'], dest: 'dist/', flatten: true, expand: true},
          {cwd:'build/', src: ['/_bower.js'], dest: 'dist/', flatten: true, expand: true}
        ]
        
      }
    },
    bower_concat: {
      all: {
        dest: 'dist/_bower.js',
        cssDest: 'dist/edi-lint.css',
        dependencies: {
          angular: 'jquery',
          angular_material: ['angular','angular-animate','angular-aria']
        }
      }
    },
    watch: {
      files: ['src/**/*','bower_components/**/*'],
      tasks: ['default']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-bower-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task(s).
  grunt.registerTask('default', ['bower_concat','copy']);

};