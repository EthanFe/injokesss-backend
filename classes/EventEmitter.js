class EventEmitter {
	
	constructor(){
		this.bin = new Object
    }

	on(event, callback){
		if(this.bin[event] == undefined) this.bin[event]= new Array
		this.bin[event].push(callback)
    }

	emit(event, payload){
		if(this.bin[event]) this.bin[event].forEach( callback => callback(payload))
    }
	

}

module.exports=  {
  EventEmitter
}