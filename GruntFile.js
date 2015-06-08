module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-filerev');
    //grunt.loadNpmTasks('grunt-exec');

    grunt.initConfig({
        /**
         * renames files based on hashing algorithms and moves them to dist/scripts
         */
        filerev: {
            options: {
                algorithm: 'md5',
                length: 8
            },
            scripts: {
                src: 'dist/scripts/build.js',
                dest: 'dist/scripts'
            },
            css: {
                src: ['dist/styles/app.min.css', 'dist/styles/vendor.min.css'],
                dest: 'dist/styles'
            }
        },


        /**
         * clear the production folder to start over the build process
         */
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        'dist/{,*/}*',
                        '!dist/.git*'
                    ]
                }]
            }
        },

        uglify: {
            dist: {
                files: {
                    'dist/scripts/build.js': [
                        "bower_components/jQuery/dist/jquery.min.js",
                        "bower_components/toastr/toastr.min.js",
                        "lib/redactor/redactor.js",
                        "lib/redactor/plugins/table.js",
                        "lib/redactor/plugins/video.js",
                        "lib/redactor/plugins/esimagemanager.js",
                        "lib/redactor/plugins/esimageedit.js",
                        "lib/redactor/plugins/filemanager.js",
                        "lib/redactor/plugins/fontsize.js",
                        "lib/redactor/plugins/fontfamily.js",
                        "lib/redactor/plugins/fontcolor.js",
                        "lib/redactor/plugins/fullscreen.js",
                        "lib/redactor/plugins/codemirror.js",
                        "plugins/servershim.js",
                        "plugins/esplugin.js"
                    ]
                }
            }
        },

        /**
         * copy files from development folder to production folder
         * note that css styles are copied from the concat task
         */
        copy: {
            main: {
                files: [
                    {cwd: 'styles', src: 'fonts/**', dest: 'dist/', expand: true}
                    //{src: 'build.js', dest: 'dist/scripts/', isFile: true, expand: true}                    
                ]
            },
            indexFile: {
                options: {
                    process: function (content, srcpath) {
                        var stringToReplace; 
                        var js = 
                            '<script src="' + grunt.filerev.summary['dist/scripts/build.js'].replace('dist/', '') + '"></script>\n';
                        var css = 
                            '<link rel="stylesheet" href="' + grunt.filerev.summary['dist/styles/vendor.min.css'].replace('dist/', '') + '">\n' +
                            '<link rel="stylesheet" href="' + grunt.filerev.summary['dist/styles/app.min.css'].replace('dist/', '') + '">\n';
                       
			/*
                        var js = '<script src="scripts/build.js"></script>\n';
                        var css = 
                            '<link rel="stylesheet" href="styles/vendor.min.css">\n' +
                            '<link rel="stylesheet" href="styles/app.min.css">\n';
			*/

                        //replace the script includes with the production ones
                        stringToReplace = /<\!-- build:js\(app\) --\>(.|\n)*?<\!-- endbuild --\>/gi;
                        content = content.replace(stringToReplace, js);

                        //replace css links
                        stringToReplace = /<\!-- build:css\(app\) --\>(.|\n)*?<\!-- endbuild --\>/gi;
                        content = content.replace(stringToReplace, css);
                        return content;
                    }
                },
                files: [
                    {src:'index.html', dest: 'dist', filter: 'isFile', expand: true}
                ]
            }
        },

        /**
         * concatenates all separately minified css files into app.min.css
         */
        concat: {
            dist_css: {
                options: {
                    sourceMap: true
                },
                files: {
                    'dist/styles/app.css': [
                        'styles/formatting.css',
                        'styles/main.css',
                        'styles/print.css'
                    ]
                }
            },
            dist_vendor_css: {
                files: {
                    'dist/styles/vendor.css': [
                        'lib/redactor/redactor.css',
                        'bower_components/toastr/toastr.min.css',
                        'styles/css/font-awesome.css'
                    ]
                }
            }
        },

        /**
         * minifies each css file and moves it to dist/styles/
         * @type {Object}
         */
        cssmin: {
            target: {
                files: [{
                    expand: true,
                    cwd: 'dist/styles/',
                    src: '{,*/}*.css',
                    dest: 'dist/styles',
                    ext: '.min.css',
                    flatten: true
                }]
            }
        }


    }); //end initConfig

    grunt.registerTask('applyRevisions', [
        'filerev:scripts'
    ]);

    grunt.registerTask('bundle', [
        'lintjs',
        'exec:bundle'
    ]);

    grunt.registerTask('lintjs', [
        'jshint:all'
    ]);

    grunt.registerTask('build', [
        'clean:dist',
        'uglify:dist',
        'copy:main',
        'concat',
        'cssmin',
        'filerev',
        'copy:indexFile'
    ]);
};
