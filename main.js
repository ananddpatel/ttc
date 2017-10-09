// $(()=>{

var workURL = '//webservices.nextbus.com/service/publicJSONFeed?command=predictionsForMultiStops&a=ttc&stops=35|7300&stops=195|7300&stops=96|5041&stops=186|5041'
var homeUrl = '//webservices.nextbus.com/service/publicJSONFeed?command=predictionsForMultiStops&a=ttc&stops=35|5507&stops=195|5507&stops=96|15248&stops=186|15248'
var wowurl = 'http://starterapi.herokuapp.com/people/123'
var stops = {
	work: [7300, 5041],
	home: [15248, 5507]
}

var getData = async (url) => {
	var predictions;
	var jqxhr = $.get(url)
	await jqxhr.done((data, status) => {
			var p = data.predictions
			if (p) {predictions = p}
		})
	jqxhr.fail((data, status, msg) => $('#errors').html(`<h2 class="text-center">Error</h2><code>${JSON.stringify(data.responseJSON)}</code>`))
	return predictions;
}

var getStopPredTimes = (preds) => {
	times = {} //
	preds.forEach(pred => {
		var tag = pred.stopTag
		stopTimes = times[tag] // key
		if (!times[tag]) { 
			times[tag] = collectTimes(pred);
		}
		else {
			times[tag] = times[tag].concat(collectTimes(pred));
		}
	})
	return times;
}

var collectTimes = (pred) => {
	collected = []
	var dir = pred.direction
	if (dir) {
		// for route that only has 1 type of bus: dir = obj
		// for multi busses dir = array
		if (Array.isArray(dir.prediction)) {
			dir.prediction.forEach(item => collected.push(collectPredData(item)))
		} else if (Array.isArray(dir)) {
			dir.forEach(item => {
				if (item.prediction.length > 1) {
					item.prediction.forEach(innerPred => collected.push(collectPredData(innerPred)))
				} else {
					collected.push(collectPredData(item.prediction))
				}
			})
		} else {
			collected.push(collectPredData(dir.prediction))
		}
	}
	return collected
}

var buildTable = (timeData, relStops, id) => {
	var tbody = $(id)
	innerHtml = ''
	tbody.html(innerHtml)
	relStops.forEach(stopTag => {
		var data = timeData[stopTag].sort((a, b) => a.time - b.time)
		if (relStops.indexOf(stopTag) == 0) {
			data.forEach(d => {
				var time = parseInt(d.time)
				innerHtml += `<tr>
					<td class="a-bus">${d.branch}</td>
					<td class="a-time">${timeDiff(time)} min<p><small class="text-muted">${getHMS(time)}</small></p></td>
				</tr>`
			})
			tbody.html(innerHtml)
		} else {
			var tr = $(id + ' tr')
			for (var i = 0; i < data.length; i++) {
				var d = data[i]
				var time = parseInt(d.time)
				if (i >= tr.length) {
					$(id)[0].innerHTML += `<td></td><td></td><td class="b-bus">${d.branch}</td>
					<td class="b-time">${timeDiff(time)} min<p><small class="text-muted">${getHMS(time)}</small></p></td>`
				} else {
					tr[i].innerHTML += `<td class="b-bus">${d.branch}</td>
						<td class="b-time">${timeDiff(time)} min<p><small class="text-muted">${getHMS(time)}</small></p></td>`
				}
			}
		}
	})
}

/**
 * HELPER FUNCIONS
 */

var collectPredData = predObj => {
	return {
		'branch': getBusNum(predObj.dirTag),
		'time': predObj.epochTime,
		'affectedByLayover': predObj.affectedByLayover ? true : false
	}
}

var timeDiff = (then) => {
	var now = new Date()
	var then = new Date(then)

	var seconds = Math.floor((then - (now))/1000);
    var minutes = Math.floor(seconds/60);
    var hours = Math.floor(minutes/60);
    var days = Math.floor(hours/24);
    
    hours = hours-(days*24);
    minutes = minutes-(days*24*60)-(hours*60);
    seconds = seconds-(days*24*60*60)-(hours*60*60)-(minutes*60);
    seconds = seconds.toString()
    var secModified = seconds < 10 ? '0'+seconds : seconds
	return minutes + ':' + secModified
}

var getHMS = (time) => {
	var d = new Date(time)
	return d.toLocaleString('en-US').split(', ')[1]
}

var getBusNum = (dirTag) => {
	dirTag = dirTag.split('_')
	return dirTag[dirTag.length - 1]
}

/**
 * MAIN
 */

var doMain = async (url, stops, id) => {
	var predictions = await getData(url)
	var stopPredTimes = getStopPredTimes(predictions)
	buildTable(stopPredTimes, stops, id)
}

$('#home2work h1').on('click', () => doMain(workURL, stops.work, '#home2work tbody'))
// $('#home2work h1').on('click', () => getData(wowurl))
$('#work2home h1').on('click', () => doMain(homeUrl, stops.home, '#work2home tbody'))



// });
