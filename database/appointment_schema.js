var Schema = {};

Schema.createSchema = function(mongoose) {
   
   // 스키마 정의
   var AppointmentSchema = mongoose.Schema({		//9개
	   email:{type:String, 'default':''},
	   sEmail:{type:String, 'default':''}
   });
   

   // 스키마에 static 메소드 추가
   // 모델 객체에서 사용할 수 있는 메소드 정의
   AppointmentSchema.static('findByEmail', function(email, callback) {
      return this.find({email:email}, callback);
   });

   console.log('AppointmentSchema 정의함.');

   return AppointmentSchema;
};

// module.exports에 Schema 객체 직접 할당
module.exports = Schema;