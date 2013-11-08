#!/usr/bin/env node

var action = process.argv[2],
	config = require('./user/config.js'),
	fs = require('fs');

var uglify = require("uglify-js"),
	sqwish = require('sqwish');

var Build = {};

Build.html = function() {
	console.log('Building HTML');
	var html = fs.readFileSync('res/home.html');
	for (var prop in config)
		html = html.toString().replace(new RegExp('{{'+prop+'}}', 'g'), config[prop]);

	fs.writeFileSync('index.html', html);
}

Build.js = function() {
	console.log('Minifying JS');
	var js = uglify.minify(["js/minified.js", "js/history.js", "js/router.js", "js/readingTime.js", "user/config.js", "js/script.js"], {
	    outSourceMap: "min.js.map"
	});
	fs.writeFileSync('min.js', js.code + '//# sourceMappingURL=min.js.map');
	fs.writeFileSync('min.js.map', js.map);
}

Build.css = function() {
	console.log('Minifying CSS');
	var css = fs.readFileSync('res/style.css', "utf8");
	fs.writeFileSync('min.css', sqwish.minify(css, true) + '/*@ sourceURL=res/style.css */');
}

Build.watch = function() {
	var watch = require('watch');
	watch.createMonitor('.', {ignoreDotFiles: true}, function (monitor) {
		//monitor.files['/home/mikeal/.zshrc'] // Stat object for my zshrc.
	    monitor.on("created", function (f, stat) { });
	    monitor.on("changed", function (f, curr, prev) {
	    	var ext = f.split('.').pop();
	    	console.log(ext);
	    	if (ext == ('css' || 'js')) Build[ext]();
	    	console.log(f);
	    });
	    monitor.on("removed", function (f, stat) { });
	});
}

var Posts = {};

Posts.publish = function(file) {
	var title = file.replace('.md', ''),
		filename = title.replace(/ /g, '_').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase(),
		post = fs.readFileSync('post/drafts' + file, "utf8");

	var data = config;
	data.url = config.blogurl + '/post/' + filename + '.html';
	data.title = title;
	data.img = config.blogurl + '/post/' + filename + '.jpg';
	data.date = new Date().toISOString();
	data.article = markdown.toHTML(post);

	var html = fs.readFileSync('res/post.html');

	for (var prop in data)
		html = html.toString().replace(new RegExp('{{'+prop+'}}', 'g'), data[prop]);

	fs.writeFileSync('post/' + filename + '.html', html);

	//fs.renameSync('post/drafts/' + file, 'post/published/' + file);
	var img = 'post/drafts/' + file.replace('.md', '.jpg');
	//fs.renameSync(img, 'post/' + filename + '.jpg');
	fs.createReadStream(img).pipe(fs.createWriteStream('post/' + filename + '.jpg'));

	var posts = fs.readFileSync('posts.txt', "utf8").split(',');
	posts.pop();
	if (posts.indexOf(filename) == -1)
		fs.appendFileSync('posts.txt', filename + ',');
}

function publishPosts() {
	var markdown = require("markdown").markdown;

	var drafts = fs.readdirSync('post/drafts');
	for (var i in drafts) {
		var stat = fs.statSync('post/drafts' + drafts[i]);
		if (!stat.isFile() || drafts[i].indexOf('.md') == -1)
		continue;

		
	}
}

if (action == 'deploy') {
	Build.html();
	Build.js();
	Build.css();
} else if (action == 'post')
	publishPosts();
else if (action == 'develop')
	develop();
else
	console.log('Use "deploy" to compile the blog and "post" to post the draft(s)');

// i have to create another