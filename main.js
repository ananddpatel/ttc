// $(()=>{

var workURL = 'http://webservices.nextbus.com/service/publicJSONFeed?command=predictionsForMultiStops&a=ttc&stops=35|7300&stops=195|7300&stops=96|5041&stops=186|5041'
var homeUrl = 'http://webservices.nextbus.com/service/publicJSONFeed?command=predictionsForMultiStops&a=ttc&stops=35|5507&stops=195|5507&stops=96|15248&stops=186|15248'
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
		} else {
			dir.forEach(item => {
				if (item.prediction.length > 1) {
					item.prediction.forEach(innerPred => collected.push(collectPredData(innerPred)))
				} else {
					collected.push(collectPredData(item.prediction))
				}
			})
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
		console.log('sorted: ', data)
		if (relStops.indexOf(stopTag) == 0) {
			data.forEach(d => {
				var time = new Date(parseInt(d.time))
				innerHtml += `<tr>
					<td class="a-bus">${d.branch}</td>
					<td class="a-time">${time.getMinutes()}:${time.getSeconds()} min <p><small>10:35:11am</small></p></td>
				</tr>`
			})
			tbody.html(innerHtml)
		} else {
			var tr = $(id + ' tr')
			for (var i = 0; i < data.length; i++) {
				var d = data[i]
				var time = new Date(parseInt(d.time))
				if (i >= tr.length) {
					$(id)[0].innerHTML += `<td></td><td></td><td class="b-bus">${d.branch}</td>
					<td class="b-time">${time.getMinutes()}:${time.getSeconds()} min</td>`
				} else {
					tr[i].innerHTML += `<td class="b-bus">${d.branch}</td>
						<td class="b-time">${time.getMinutes()}:${time.getSeconds()} min</td>`
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
		'branch': predObj.branch,
		'time': predObj.epochTime,
		'affectedByLayover': predObj.affectedByLayover ? true : false
	}
}

var timeDiff = (a, b) => {
	var a = new Date(a)
	var b = new Date(b)
	var diff = b - a; // this is a time in milliseconds
	var diff_as_date = new Date(diff);
	diff_as_date.getHours(); // hours
	diff_as_date.getMinutes(); // minutes
	diff_as_date.getSeconds(); // seconds
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
