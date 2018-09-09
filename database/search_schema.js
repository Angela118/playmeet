
var Schema = {};

Schema.createSchema = function(mongoose) {
	
	// 스키마 정의
	var SearchSchema = mongoose.Schema({
        email: {type: String, 'default':''},
		search_teamname: {type: String, 'default':''},
		search_add0: {type:String, 'default':''},
		search_add1: {type:String, 'default':''},
		search_gender: {type:Number, default:0},
		search_age: {type:Number, default:0},
		search_event_date: {type: String, 'default':''},
		search_event_time: {type: String, 'default': 'none'},
		search_event_day: {type: String, 'default': 'none'},
		search_number:{type:Number}
	});
	

	// 스키마에 static 메소드 추가
	// 모델 객체에서 사용할 수 있는 메소드 정의
	SearchSchema.static('findByEmail', function(email, callback) {
		return this.find({email:email}, callback);
	});

	console.log('SearchSchema 정의함.');

	return SearchSchema;
};

// module.exports에 Schema 객체 직접 할당
module.exports = Schema;