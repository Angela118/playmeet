

var Schema = {};
//var an=0;

Schema.createSchema = function(mongoose) {
	

	var newDate = new Date();

	// Get the month, day, and year.
	var monthString = (newDate.getMonth() + 1);
	var dayString = newDate.getDate();
//	dateString += newDate.getFullYear();

	
	// 스키마 정의
	var ApplicationSchema = mongoose.Schema({		//22개
		email: {type: String, 'default':''},
		teamname: {type: String, index: 'hashed', 'default':''},
		career_year: {type:Number, 'default':''},
		team_talent: {type:Number, 'default':''},
		add: [{type: String, 'default':''}],
		region : {type:String, 'default':''},
		move : {type:String, 'default':''},
		age: {type:Number, default:''},
		gender:{type:Number, default:25},
		event_date: {type: String, 'default': ''},
		event_time: {type: String, 'default': ''},
		event_day: {type: String, 'default': ''},
		mention:{type: String, default:''},
		geoLng:{type:Number, 'default':''},
		geoLat:{type:Number, 'default':''},
		nofteam : {type:String, 'default':''},
		created_month: {type: String, 'default': monthString},
		created_day: {type: String, 'default': dayString},
		application_number: {type:Number},
		
		eventYear_forExpire: {type:Number},
		eventMonth_forExpire: {type:Number},
		eventDate_forExpire: {type:Number},
		eventTime_forExpire: {type:Number},
		
		match:{type:Number, 'default':0}	//0:아무것도아님 1:신청 2:승낙
   });


	// 스키마에 static 메소드 추가
	// 모델 객체에서 사용할 수 있는 메소드 정의
	ApplicationSchema.static('findByEmail', function(email, callback) {
		return this.find({email:email}, callback);
	});

	console.log('ApplicationSchema 정의함.');

	return ApplicationSchema;
};

// module.exports에 Schema 객체 직접 할당
module.exports = Schema;

