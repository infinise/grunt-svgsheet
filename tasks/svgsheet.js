/*
 * grunt-svgsheet
 * https://github.com/infinise/grunt-svgsheet
 *
 * Copyright (c) 2015 infinise
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
  var fs = require('fs');
  var path = require('path');
  var cheerio = require('cheerio');
  var parse = require('svg-path-parser');
  var logSymbols = require('log-symbols');
  var ejs = require('ejs');


  function translateChildren(i, $el, filepath, tx, ty) {
    switch ($el.name) {

      case 'g':
        $el.children.forEach(function($el, i){
          translateChildren(i, $el, filepath, tx, ty);
        });
        break;

      case 'path':
        // Parse path and translate the individual commands,
        // then reassemble as a new path string
        var d = parse($el.attribs.d);
        var dnew = '';
        var args = ['x1','y1','x2','y2','x','y'];

        d.forEach(function(cmd){
          if (!cmd.relative) {
            args.forEach(function(arg){
              if (cmd[arg] != undefined) cmd[arg] += (arg[0] == 'x') ? tx : ty;
            });
          }

          function b(s) { return s ? 1 : 0 }

          dnew += cmd.code;
          if (cmd.code.toLowerCase() === "a") {
            dnew += cmd.rx + ' ' + cmd.ry + ' '
                  + cmd.xAxisRotation + ' ' + b(cmd.largeArc) + ' ' + b(cmd.sweep) + ' '
                  + cmd.x + ' ' + cmd.y;
          } else {
            args.forEach(function(arg){
              if (cmd[arg] != undefined) dnew += cmd[arg] + ' ';
            });
          }
        });

        $el.attribs.d = dnew;
        break;

      case 'circle':
        $el.attribs.cx = String( parseFloat($el.attribs.cx) + tx );
        $el.attribs.cy = String( parseFloat($el.attribs.cy) + ty );
        break;

      case 'rect':
        $el.attribs.x = String( parseFloat($el.attribs.x) + tx );
        $el.attribs.y = String( parseFloat($el.attribs.y) + ty );
        break;

      default:
        grunt.log.writeln(logSymbols.error, filepath, ': Sorry, ' + $el.name + ' is not implemented yet');

    }
  }


  grunt.registerMultiTask('svgsheet', 'Creates a sprite sheet out of SVGs.', function() {

    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      iconPadding: 10,
      iconDefaultWidth: 100,
      iconDefaultHeight: 100,

      sheetMaxWidth: 500,

      generateCss: true,
      generateHtml: true,
      cssTemplate: __dirname + '/../templates/css.ejs',
      htmlTemplate: __dirname + '/../templates/html.ejs'
    });

    // Iterate over all specified file groups.
    this.files.forEach(function(f) {
      var tx = options.iconPadding,
          ty = options.iconPadding;
      var fileWidth = 0,
          fileHeight = 0;
      var rowHeight = 0;

      var destDir = path.dirname(f.dest),
          destName = path.basename(f.dest, '.svg');

      var $resultDocument = cheerio.load('<svg xmlns="http://www.w3.org/2000/svg"></svg>', { xmlMode: true }),
          $resultSvg = $resultDocument('svg');

      var icons = [];

      // Process source files
      var src = f.src.filter(function(filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn(logSymbols.error, 'Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      }).map(function(filepath) {

        var icon = {
          filename: path.basename(filepath, '.svg'),
        };
        icon.filenameSanitized = icon.filename.toLowerCase().replace(/\W+/g, "-");

        var contentStr = grunt.file.read(filepath);
        var $ = cheerio.load(contentStr, {
              normalizeWhitespace: true,
              xmlMode: true
            });
        var $svg = $('svg');

        // Move all the elements in the SVG to their new position
        $svg.children().each(function(i, $el){
          translateChildren(i, $el, filepath, tx, ty);
        });

        // Carry over attributes from the root SVG element
        var attrs = ['opacity','fill','fill-opacity','stroke','stroke-width','stroke-opacity'];
        var rootAttrs = [];

        attrs.forEach(function(a){
          if ($svg.attr(a)) rootAttrs.push(a);
        })

        if (rootAttrs.length) {
          var $g = $("<g></g>").html($svg.html());
          rootAttrs.forEach(function(a){
            $g.attr(a, $svg.attr(a));
          })
          $svg.html($g);
        }

        // Add SVG to the sheet
        $resultSvg.append($svg.html());

        icon.left = -tx;
        icon.top = -ty;
        icons.push(icon);

        // Try to determine current SVG size
        if ($svg.attr('height')) {
          icon.height = parseInt( $svg.attr('height') );
          icon.width = parseInt( $svg.attr('width') );
        }
        else if ($svg.attr('viewBox')) {
          var viewbox = $svg.attr('viewBox').split(' ');

          icon.height = parseInt(viewbox[3]);
          icon.width = parseInt(viewbox[2]);
        }
        else {
          icon.height = options.iconDefaultHeight;
          icon.width = options.iconDefaultWidth;

          grunt.log.writeln(logSymbols.warning, filepath, ': No width/height or viewBox found');
        }

        // Move position along for the next file
        rowHeight = Math.max(rowHeight, icon.height);

        if (tx + icon.width < options.sheetMaxWidth) {
          tx += icon.width + options.iconPadding;
        } else {
          ty += rowHeight + options.iconPadding;
          tx = options.iconPadding;
          rowHeight = 0;
        }

        fileWidth = Math.max(fileWidth, tx + icon.width + options.iconPadding);
        fileHeight = Math.max(fileHeight, ty + icon.height + options.iconPadding);
      });

      // Write the SVG sheet
      $resultSvg.attr("width", fileWidth);
      $resultSvg.attr("height", fileHeight);

      grunt.file.write(f.dest, $resultDocument.html());
      grunt.log.writeln(logSymbols.success, f.dest);

      // Write the CSS
      var ejsData = {
        'icons': icons,
        'destName': destName
      }

      if (options.generateCss) {
        var tpl = fs.readFileSync(options.cssTemplate, 'utf8')
        var out = ejs.render(tpl, ejsData);
        var outPath = path.join(destDir, destName + ".css");

        grunt.file.write(outPath, out);
        grunt.log.writeln(logSymbols.success, outPath);
      }

      // Write the HTML
      if (options.generateHtml) {
        var tpl = fs.readFileSync(options.htmlTemplate, 'utf8')
        var out = ejs.render(tpl, ejsData);
        var outPath = path.join(destDir, destName + ".html");

        grunt.file.write(outPath, out);
        grunt.log.writeln(logSymbols.success, outPath);
      }
    });
  });

};
