function ReadingTime(element) {
	this.element = $(element);
	this.scroll_timer = null;
	this.init();
}

ReadingTime.prototype = {
	init: function () {
		$(document).on('scroll', this.updateTime, [this]);
		$('body').add(EE('div', {'@id': "scrollbubble"}));
	},
	pos: function (elem) {
	    var left = 0, top = 0;
	    do {
	        left += elem.offsetLeft;
	        top += elem.offsetTop;
	    } while ( elem = elem.offsetParent );
	    return {left: left, top: top};
	},
	updateTime: function (_this) {
		var bubble = $('#scrollbubble');
	  	if (_this.pos(_this.element[0]).top > window.scrollY)
			return;
	  	var viewportHeight = window.innerHeight,
	   		scrollbarHeight = viewportHeight / document.body.scrollHeight * viewportHeight,
	   		page_progress = window.scrollY / (document.body.scrollHeight - viewportHeight),
	   		progress = window.scrollY / (_this.pos(_this.element[0]).top + parseInt(_this.element.get('$height')) - viewportHeight),
	   		distance = page_progress * (viewportHeight - scrollbarHeight) + scrollbarHeight / 2 - parseInt(bubble.get('$height')) / 2;
	  	var total_reading_time = _this.calculate_total_time_words() / 60;
	  	var total_reading_time_remaining = Math.ceil(total_reading_time - (total_reading_time * progress));
	  	var text = '';

	  	if (total_reading_time_remaining > 1)
			text = total_reading_time_remaining + ' minutes left';
	  	else if (progress >= 1) {
			text = 'Thanks for reading';
			$.off(_this.updateTime);
	  	} else if (total_reading_time_remaining <= 1)
			text = 'Less than a minute';

	  	bubble.set('$top', distance+'px').fill(text).set({$$fade: 1});

		// Fade out the annotation after 1 second of no scrolling.
		if (_this.scroll_timer !== null)
			clearTimeout(_this.scroll_timer);

		_this.scroll_timer = setTimeout(function() {
			bubble.set({$$fade: 1}).animate({$$fade: 0}, 500);
		}, 1000);
	},
	calculate_total_time_words: function() {
		var total = 0;
		this.element.each(function(item) {
			total += Math.round(60*$(item).text().split(' ').length/200); // 200 = number of words per minute
		});
		return total;
	}
};