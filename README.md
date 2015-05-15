# grunt-svgsheet

Creates a sprite sheet out of SVGs by actually re-positioning the content of the individual SVGs on the sheet, rather than using `<symbol>` or `<defs>`. Also creates CSS and demo HTML files using EJS templates.

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-svgsheet --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-svgsheet');
```

## The "svgsheet" task

### Overview
In your project's Gruntfile, add a section named `svgsheet` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  svgsheet: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options

#### options.iconPadding
Type: `Number`
Default value: `10`

Padding added around icons in the SVG sheet, to prevent overlap and make it look nicer.

#### options.iconDefaultWidth
Type: `Number`
Default value: `100`

Width used for icons if no width is found in the SVG.

#### options.iconDefaultHeight
Type: `Number`
Default value: `100`

Height used for icons if no height is found in the SVG.

#### options.sheetMaxWidth
Type: `Number`
Default value: `500`

Maximum width of the sprite sheet, to make it look nicer.

#### options.generateCss
Type: `Boolean`
Default value: `true`

Whether to generate a CSS file for the sprite sheet.

#### options.generateHtml
Type: `Boolean`
Default value: `true`

Whether to generate a demo HTML file.

#### options.cssTemplate
Type: `String`
Default value: `templates/css.ejs'`

Path to the EJS template file to use for the CSS. See existing for example.

#### options.htmlTemplate
Type: `String`
Default value: `templates/html.ejs'`

Path to the EJS template file to use for the HTML demo. See existing for example.

