/** fcm-node 모듈 설치 필요 */
// --> npm install fcm-mode --save
var FCM = require('fcm-node');
 
/** Firebase(구글 개발자 사이트)에서 발급받은 서버키 */
// 가급적 이 값은 별도의 설정파일로 분리하는 것이 좋다.
var serverKey = 'AAAACgDmJXk:APA91bHwNjQcIeWEkiLuOKQWJKNzsiWbh5Fk0CfpUwSXHRv9t-acdcGJvZ_NBAkvSFex3nUwEU0QpOnQteczkP6ry-x_7x1_Y9odqxTgY3ijJ6vUUFBdEWtBcsZsbJGMO46wx9cMA-BP';
 


/** 아래는 푸시메시지 발송절차 */
var fcm = new FCM(serverKey);

exports.sendPushAlert = function(client_token, push_message){
	var push_data = {
		// 수신대상
		to: client_token,
		// App이 실행중이지 않을 때 상태바 알림으로 등록할 내용
		notification: {
			title: "Play Meet",
			body: push_message,
			sound: "default",
			click_action: "FCM_PLUGIN_ACTIVITY",
			icon: "fcm_push_icon"
		},
		// 메시지 중요도
		priority: "high",
		// App 패키지 이름
		restricted_package_name: "com.playmeet.playmeet",
		// App에게 전달할 데이터
/*		data: {
			num1: 2000,
			num2: 3000
		}
		
		*/
	};
	
	fcm.send(push_data, function(err, response) {
		if (err) {
			console.error('Push메시지 발송에 실패했습니다.');
			throw err
		}

		console.log('Push메시지가 발송되었습니다.');
		console.dir(response);
	});
};