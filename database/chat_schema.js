
var Schema = {};

Schema.createSchema = function(mongoose) {

    // 스키마 정의
    var ChatSchema = mongoose.Schema({
        email: {type: String, 'default':''},
        teamname: {type: String, index: 'hashed', 'default':''},
        message: {type: String},
        recipient: {type: String, 'default':''},
        application_number: {type:Number, 'default':''},
        cancel:{type:Number},
        created_at: {type: Date, index: {unique: false}, 'default': Date.now}
    });

    // 스키마에 static 메소드 추가
    // 모델 객체에서 사용할 수 있는 메소드 정의
    ChatSchema.static('findByEmail', function(email, callback) {
        return this.find({email:email}, callback);
    });

    console.log('ChatSchema 정의함.');

    return ChatSchema;
};

// module.exports에 Schema 객체 직접 할당
module.exports = Schema;