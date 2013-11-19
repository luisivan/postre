(function(a,b){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))window.mobile=true})(navigator.userAgent||navigator.vendor||window.opera);

var MINI = require('minified'); var $ = MINI.$, $$=MINI.$$, EE=MINI.EE;

var onlink = function(e) {
	e.preventDefault();
	History.pushState(null, config.blog, this.href);
}
$('header h1 a').on('click', onlink);

var socialData;
$('#social a').on('click', function(e) {
	e.preventDefault();
	var c = $(this).get('@class');
	var params = Object.keys(socialData[c]).map(function(k) {
	    return encodeURIComponent(k) + '=' + encodeURIComponent(socialData[c][k])
	}).join('&');
	window.open(this.href + params, null, 'width=600,height=360,top='+(window.innerHeight/2 - 180) +', left='+(window.innerWidth/2 - 300));
});

var Home = function() {
	window.post && window.post.destroy();

	this.getPosts = function() {
		$.request('get', config.blogurl+'/posts.txt').then(function(text) {
			home.posts = text.split(',').slice(0, -1);
			config.homePosts = (home.posts.length > config.homePosts) ? config.homePosts : home.posts.length;
			for (var i=0; i<config.homePosts; i++) home.addPost(home.posts[i]+'.html');
		});
	}

	this.addPost = function(file) {
		new Post(file, function(title, content, time) {
			content.removeChild(title);
			var trimmed = content.textContent.substr(0, 500);
			trimmed = trimmed.substr(0, Math.min(trimmed.length, trimmed.lastIndexOf(" "))) + '...';

			home.shouldAddPost(file, EE('article', {'@id': file}, [time, title, EE("p", trimmed)]));
		});
	}

	this.shouldAddPost = function(file, article) {
		if (this.posts.indexOf(file.replace('.html', '')) == this.postsLoaded++) {
			$('section').add(article);
			$('#'+file).set({$$fade: 0}).animate({$$fade: 1});
		} else
			setTimeout(this.shouldAddPost.bind(this, file, article), 100);
	}

	this.destroy = function() {
		$.off(this.onscroll);
		$('section article').remove();
	}

	this.postsLoaded = 0;
	this.posts = [];
	this.getPosts();

	$(document).on('scroll', this.onscroll = function() {
	    if (window.scrollY > (document.body.scrollHeight - 100) - window.innerHeight)
	    	if (home.postsLoaded < home.posts.length)
	        	home.addPost(home.posts[home.postsLoaded]+'.html');
	});
}

var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

var Post = function(file, cb) {
	$('section').on('article h1 a', 'click', onlink);

	this.file = config.blogurl + '/post/'+file;

	this.load = function(cb) {
		$.request('get', this.file).then(function(html) {
			var article = document.createElement('div');
			article.innerHTML = html;
			var date = new Date(article.querySelector('meta[property="og:article:published_time"]').getAttribute('content').split('T')[0]),
				time = EE('time', date.getDate()+' '+months[date.getMonth()]+' '+date.getFullYear()),
				title = article.getElementsByTagName('h1')[0];
			title.firstChild.onclick = onlink;
			cb(title, article.getElementsByTagName('article')[0], time);
		});
	}

	this.render = function(title, content, time) {
		window.home && window.home.destroy();
		document.title = title.textContent + ' | ' + config.blog;
		$('#image').set('$backgroundImage', 'url('+this.file.replace('.html', '.jpg')+')').set({$display: 'block', $top: '-342px'}).animate({$top: '0px'});
		$('section').addFront(content);
		$(content).addFront(time).set({$$fade: 0}).animate({$$fade: 1});
		this.loadSocial();
		this.loadComments();
		if (!window.mobile)
			var r = new ReadingTime(content);
		else
			$('header h2, #twitter').set('$display', 'none');
	}

	this.loadSocial = function() {
		$("#social").set({$display: 'block', $$fade: 0}).animate({$$fade: 1});
		var title = $('article h1').sub(0,1).text();
		socialData = {
			twitter: { text: title, url: this.file, via: config.twitter },
			facebook: { u: this.file },
			google: { url: this.file },
			linkedin: { url: this.file },
			tumblr: { t: title, u: encodeURIComponent(this.file) }
		}

		var follow = EE('a', {'@href': "https://twitter.com/"+config.twitter, '@class': "twitter-follow-button", "%show-count": "false", "%size": "large"}, 'Follow @'+config.twitter);
		$('article').add(follow);
		$('body').add(EE('script', {'@async': true, '@src': '//platform.twitter.com/widgets.js'}));

		if (window.mobile) return;
		$(document).on('scroll', this.onscroll = function() {
			var distance = (window.scrollY > 329) ? window.scrollY-329-20 : 0;
		    $('#social').animate({'$top': distance+'px'}, 50);
		});
	}

	this.loadComments = function() {
	   	$('section').add(EE('div', {'@id': 'disqus_thread'})).add(EE('script', {'@async': true, '@src': '//' + config.disqus + '.disqus.com/embed.js'}));
	    $('#disqus_thread').set({$$fade: 0}).animate({$$fade: 1});
	}

	this.destroy = function() {
		$('section article, #scrollbubble, #disqus_thread').remove();
		$('#social').set('$display', 'none');
		$('#image').animate({$top: '-342px'});
	}

	this.load(cb);
}

var route = function() {
    var hash = History.getState().url.replace(config.blogurl, '').split('/');
    if (!hash[1])
		window.home = new Home();
	else
		window.post = new Post(hash[2], function(article, title, time) { post.render(article, title, time) });
}

History.Adapter.bind(window, 'statechange', route);

var path = /.+?\:\/\/.+?(\/.+?)(?:#|\?|$)/.exec(config.blogurl).pop();
if (path[path.length-1] != '/') path += '/';
if (window.location.search.indexOf('?post=') !== -1)
	History.replaceState(null, null, path + 'post/' + window.location.search.replace('?post=', ''));
else
	route();

var $buoop = {vs:{i:9,f:15,s:4,n:9}};