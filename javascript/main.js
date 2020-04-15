// 加速度サービスUUID
const ACCELEROMETER_SERVICE_UUID = 'e95d0753-251d-470a-a062-fa1922dfa9a8';
// 加速度キャラクタリスティックUUID
const ACCELEROMETER_CHARACTERISTICS_UUID = 'e95dca4b-251d-470a-a062-fa1922dfa9a8';

let microbit = null;
let angle = null;
let timer = null;

//画面をクリックしたらmicro:bitとBluetooth接続する
$(function()
{
	$('.player').css('top', $(window).height()/2+'px');

	$(window).click(function()
	{
		connect();
	});
});

/* -----------------------------------------------
 * ゲーム開始
----------------------------------------------- */
function startGame()
{
	timer = setInterval(function()
	{
		if (Math.random() < 0.2)
		{
			let x = Math.random() * $(window).width();

			$('<div></div>')
			.addClass('block')
			.css('left', x+'px')
			.appendTo('body');
		}

		let playerX = parseInt($('.player').css('left'));
		let playerY = parseInt($('.player').css('top'));
		let playerWidth = parseInt($('.player').css('width'));
		let playerHeight = parseInt($('.player').css('height'));;

		let playerCenterX = playerX + playerWidth / 2.0;
		let playerCenterY = playerY + playerHeight / 2.0;

		if (angle)
		{
			// 移動量
			let move = 8;

			if (angle > 0 && angle < 90)
			{
				move *= 1;
			}
			if (angle > 90 && angle < 180)
			{
				move *= -1;
			}

			let x = 0;
			if (x >= 0 && x + playerWidth <= $(window).width())
			{
				x = playerX + move;
			}

			$('.player').css('left', x+'px');
		}

		$('.block').each(function(idx)
		{
			let top = parseInt($(this).css('top')) + 5;
			$(this).css('top', top+'px');

			let left = parseInt($(this).css('left'));
			let width = parseInt($(this).css('width'));
			let height = parseInt($(this).css('height'));

			let centerX = left + width / 2.0;
			let centerY = top + height / 2.0;

			// 当たり判定
			if (Math.abs(centerX - playerCenterX) < width/2 + playerWidth/2 && Math.abs(centerY - playerCenterY) < height/2 + playerHeight/2)
			{
				disconnect();
			}

			if ($(window).height()/2 + 100 < top)
			{
				$(this).remove();
			}
		});

	}, 100);
}
/* -----------------------------------------------
 * ゲーム停止
----------------------------------------------- */
function stopGame()
{
	clearInterval(timer);
	timer = null;

	$('.block').remove();
}
/* -----------------------------------------------
 * ペアリング開始
----------------------------------------------- */
function connect()
{
	console.log('connect');

	// BLEデバイスをスキャンする
	navigator.bluetooth.requestDevice({
		// acceptAllDevices: true,
		filters: [{
			namePrefix: 'BBC micro:bit'
		}],
		optionalServices: [ACCELEROMETER_SERVICE_UUID]
	})
	// デバイス接続する
	.then(device => {
		console.log(device);
		microbit = device;
		return device.gatt.connect();
	})
	// 加速度センササービスを取得する
	.then(server => {
		console.log(server);
		return server.getPrimaryService(ACCELEROMETER_SERVICE_UUID);
	})
	// キャラクタリスティックを取得する
	.then(service => {
		console.log(service);
		return service.getCharacteristic(ACCELEROMETER_CHARACTERISTICS_UUID);
	})
	// 加速度が変化したら指定したメソッドを呼び出す
	.then(characteristic => {
		console.log(characteristic);
		characteristic.startNotifications();
		characteristic.addEventListener('characteristicvaluechanged', accelerometerChanged);

		// ゲームスタート
		startGame();
	})
	.catch(error => {
		console.log(error);
	});
}
/* -----------------------------------------------
 * ペアリング解除
----------------------------------------------- */
function disconnect()
{
	console.log('disconnect');

	if (!microbit || !microbit.gatt.connected)
	{
		return;
	}
	microbit.gatt.disconnect();

	// ゲームストップ
	stopGame();
}

/* -----------------------------------------------
 * 加速度センサの値が変化したら呼び出される
----------------------------------------------- */
function accelerometerChanged(event)
{
	// 加速度X座標
	let accelX = event.target.value.getInt16(0, true)/1000.0;
	// 加速度Y座標
	let accelY = event.target.value.getInt16(2, true)/1000.0;
	// 加速度Z座標
	let accelZ = event.target.value.getInt16(4, true)/1000.0;
	// 角度
	angle = Math.atan2(accelZ, accelX) * (180.0 / Math.PI);
	if (accelZ > 0)
	{
		angle = 360.0 - angle;
	}
	angle = Math.abs(angle);

}





