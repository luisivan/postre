#!/usr/bin/env node

var fs = require('fs'),
	net = require('net'),
	git = require('gift'),
	watch = require('watch')
	sqwish = require('sqwish'),
	uglify = require("uglify-js"),
	markdown = require('markdown').markdown;

var action = process.argv[2],
	config = require('./user/config.js');

process.chdir(__dirname);

var Build = {

	template: function(str, data) {
		for (var prop in data)
			str = str.toString().replace(new RegExp('{{'+prop+'}}', 'g'), data[prop]);
		return str;
	},
	html: function() {
		var html = fs.readFileSync('res/home.html');
		fs.writeFileSync('index.html', Build.template(html, config));
	},
	css: function() {
		var css = fs.readFileSync('res/style.css', "utf8");
		fs.writeFileSync('min.css', sqwish.minify(css, false) + '/*@ sourceURL=res/style.css */');
	},
	js: function() {
		var js = uglify.minify(["js/minified.js", "js/history.js", "js/readingTime.js", "user/config.js", "js/script.js"], {
		    outSourceMap: "min.js.map"
		});
		fs.writeFileSync('min.js', js.code + '//# sourceMappingURL=min.js.map');
		fs.writeFileSync('min.js.map', js.map);
	}
}

var Posts = {
	template: fs.readFileSync('res/post.html'),
	
	publish: function(file) {
		console.log(file);
		var id = file.replace('.md', '').replace(/ /g, '_').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();

		var post = {orig: {md: file, img: file.replace('.md', '.jpg')}, html: 'post/'+id+'.html', img: 'post/'+id+'.jpg' };

		var data = config;
		data.url = config.blogurl +'/'+ post.html;
		data.title = file.replace('.md', '');
		data.img = config.blogurl +'/'+ post.img;
		// or existing date if you are updatingggg
		data.date = new Date().toISOString();
		data.article = markdown.toHTML(fs.readFileSync('post/drafts/' + post.orig.md, "utf8"));

		var html = Build.template(Posts.template, data);
		//.toString()?

		fs.writeFileSync(post.html, html);
		fs.renameSync('post/drafts/' + post.orig.md, 'post/published/' + post.orig.md);
		fs.createReadStream('post/drafts/' + post.orig.img).pipe(fs.createWriteStream(post.img));
		fs.renameSync('post/drafts/' + post.orig.img, 'post/published/' + post.orig.img);

		var posts = fs.readFileSync('posts.txt', "utf8").split(',').slice(0, -1);
		if (posts.indexOf(id) == -1)
			fs.appendFileSync('posts.txt', filename + ',');

		/*var item = fs.readFileSync('res/item.xml');
		data.date = new Date().toUTCString();
		for (var prop in data)
			item = item.replace(new RegExp('{{'+prop+'}}', 'g'), data[prop]);*/

		// what if i update a post... or i update my bio... what happens with the feed??
	},

	publishAll: function() {
		fs.readdirSync('post/drafts').forEach(function(draft) {
			if (draft.indexOf('.md') !== -1) Posts.publish(draft);
		});
	},

	remove: function(title) {
		var id = title.replace(/ /g, '_').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();
		fs.writeFileSync('posts.txt', fs.readFileSync('posts.txt', "utf8").replace(','+id+',', ','));
		fs.unlinkSync('post/published/'+title+'.jpg');
		fs.unlinkSync('post/'+id+'.md');
		fs.unlinkSync('post/'+id+'.jpg');
	}
}

var RSS = {};

RSS.item = function(file) {

}

var socket;

try { fs.unlinkSync('/tmp/postre.sock'); } catch (e) {}
net.createServer(function(client) {
	socket = client;
	socket.write(JSON.stringify({event: 'hello', data: __dirname}));
    client.on('data', function(data) {
    	var action = JSON.parse(data.toString()).action;
    	if (action == 'publish') {
    		Posts.publishAll();
    		repo.commit('Published new stuff', {all: true}, function(err) {
    			!err && repo.remote_push('origin HEAD:gh-pages', function(err) {
    				socket.write(JSON.stringify({event: 'success'}));
    			});
    		});
    		
    	}
    });
}).listen('/tmp/postre.sock');

var repo = git('.'),
	vipFiles = ['res/home.html', 'res/post.html', 'user/config.js'],
	devFiles = ['res/style.css', 'js/minified.js', 'js/history.js', 'js/readingTime.js', 'user/config.js', 'js/script.js'];

watch.createMonitor('.', {ignoreDotFiles: true}, function (monitor) {
    monitor.on("created", function (f, stat) {
    	if (f.indexOf('.md') == -1) return;
    	
    	socket.write(JSON.stringify({data: __dirname + '/' + f, event: 'created'}));
    });
    monitor.on("changed", function (f, curr, prev) {
    	if (vipFiles.indexOf(f) !== -1) {
    		delete require.cache[require.resolve('./user/config.js')];
    		config = require('./user/config.js');
    		Build.html();
    		fs.readdirSync('post/published').forEach(function(post) {
				fs.renameSync('post/published/'+post, 'post/drafts/'+post);
			});
    		Posts.publishAll();
    	} else if (devFiles.indexOf(f) !== -1)
	    	Build[f.split('.').pop()]();
    	else
			socket.write(JSON.stringify({data: __dirname + '/' + f, event: 'change'}));
    });
    monitor.on("removed", function (f, stat) {
    	if (f.indexOf('.md') == -1) return;

    	socket.write(JSON.stringify({data: __dirname + '/' + f, event: 'removed'}));
    	var title = f.replace('post/published/', '').replace('.md', '');
    	Posts.remove(title);
    	repo.commit(title + ' was deleted', {all: true});
    	repo.remote_push('origin gh-pages');
    });
});

/*

to create post, just create the .md and .jpg on drafts

to modify post, copy the .md to drafts

to delete post, delete the .md

*/


/*
else if (action == 'develop')

	    	if (f.indexOf('min.') !== -1 || f.indexOf('index.html') !== -1) return;
	    	console.log(f + ' was modified');
	    	var ext = f.split('.').pop();
	    	if (['html', 'js', 'css'].indexOf(ext) !== -1) Build[ext]();

*/

// i have to create another

/* 


<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
    <channel>
        <title>mysuperblog.me</title>
        <description>This is mysuperblog personnal feed!</description>
        <link>http://mysuperblog.me/</link>
        <author>yournemail@me.com (Your Name)</author>
        <lastBuildDate>Tue, 09 Apr 2013 20:46:05 GMT</lastBuildDate>
        <image>http://mysuperblog.me/image.png</image>
        <copyright>All rights reserved 2013, myself</copyright>
        <generator>Feed for Node.js</generator>
        <item>
            <title><![CDATA[Hello World]]></title>
            <link>/post/hello-world</link>
            <pubDate>Wed, 08 Aug 2012 22:00:00 GMT</pubDate>
            <description><![CDATA[<p><em>Hello world!!</em> this is my first fantastic post!</p><p><a href="/post/hello-world" title="Read more of Hello World">read more</a></p>]]></description>
        </item>
    </channel>
</rss>

*/