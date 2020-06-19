var vue = new Vue({
    el: "#top",
    data: {
        connected : false,
        device_name : '',
        mainled_value: '#000000',
        rearled_value: '0',
        speed_value: '100',
        heading_value: '0'
    },
    computed: {
    },
    methods: {
        sphero_scan: function(){
            var parent = this;
            try{
                return navigator.bluetooth.requestDevice({
                    filters: [{services:[ UUID_SPHERO_SERVICE ]}],
                    optionalServices : [UUID_SPHERO_SERVICE_INITIALIZE]
                })
                .then(device => {
                    console.log("requestDevice OK");
                    console.log(device);

                    sphero_device = device;
                    sphero_device.addEventListener('gattserverdisconnected', onDisconnect);
                    parent.device_name = sphero_device.name;
                });
            }catch(error){
                console.log('Error:' + error);
            }
        },
        sphero_connect: function(){
            if( sphero_device.connected )
                return Promise.resolve();

            var parent = this;
            try{
                return sphero_device.gatt.connect()
                .then(server => {
                    console.log('Execute : getPrimaryService');
                    sphero_chars.clear();
                    decoder_set_callback(cb_receive_packet); /* センサー情報の取得用 */
                    return Promise.all([
                        set_service_command(server),
                        set_service_initialize(server)
                    ]);
                })
                .then(() =>{
                    console.log('Execute: startNotification');
                    return sphero_chars.get(UUID_SPHERO_CHARACTERISTIC_HANDLE_1C).startNotifications();
                })
                .then(() =>{
                    console.log('Execute: startNotification');
                    return sphero_chars.get(UUID_SPHERO_CHARACTERISTIC_SUBSCRIBE).startNotifications();
                })
                .then(()=>{
                    parent.connected = true;
                    console.log('Connected!!');
                    return parent.sphero_initialize();
                });
            }catch(error){
                console.log('Error:' + error);
            }
        },
        sphero_initialize: async function(){
            console.log('sphero_initialize');

            var command;
            console.log('usetheporce');
            command = Uint8Array.from(UseTheForce);
            await sphero_chars.get(UUID_SPHERO_CHARACTERISTIC_USETHEFORCE).writeValue(command);

            console.log('wake');
            command = command_create(DeviceId.powerInfo, PowerCommandIds.wake, []);
            await sphero_chars.get(UUID_SPHERO_CHARACTERISTIC_HANDLE_1C).writeValue(Uint8Array.from(command));
            command = command_create(DeviceId.powerInfo, PowerCommandIds.wake, []);
            await sphero_chars.get(UUID_SPHERO_CHARACTERISTIC_HANDLE_1C).writeValue(Uint8Array.from(command));
        },
        /* センサー情報の取得用 */
        sphero_sensor_start: async function(){
            console.log('sphero_sensor_start');

            var command;
            command = command_create(DeviceId.sensor, SensorCommandIds.sensor1, [0x01]);
            await sphero_chars.get(UUID_SPHERO_CHARACTERISTIC_HANDLE_1C).writeValue(Uint8Array.from(command));
            command = command_create(DeviceId.sensor, SensorCommandIds.sensor2, [0x00]);
            await sphero_chars.get(UUID_SPHERO_CHARACTERISTIC_HANDLE_1C).writeValue(Uint8Array.from(command));
            command = command_create(DeviceId.sensor, SensorCommandIds.sensorMask, [0x00, 0x32, 0x00, 0x00, 0x00, 0x00, 0x00]);
            await sphero_chars.get(UUID_SPHERO_CHARACTERISTIC_HANDLE_1C).writeValue(Uint8Array.from(command));
            command = command_create(DeviceId.sensor, SensorCommandIds.configureSensorStream, [0x03, 0x80, 0x00, 0x00]);
            await sphero_chars.get(UUID_SPHERO_CHARACTERISTIC_HANDLE_1C).writeValue(Uint8Array.from(command));
        },
        sphero_disconnect: function(){
            if( sphero_device.gatt.connected ){
                sphero_device.gatt.disconnect();
            }
        },
        rearled_change: function(){
            console.log("rearled_value=", this.rearled_value);
            var command = command_create(DeviceId.userIO, UserIOCommandIds.allLEDs, [0x00, 0x01, parseInt(this.rearled_value)]);
            return sphero_chars.get(UUID_SPHERO_CHARACTERISTIC_HANDLE_1C).writeValue(Uint8Array.from(command));
        },
        mainled_change: function(){
            console.log("mainled_value=", this.mainled_value);
            var rgb = rgb_hex2bin(this.mainled_value);
            var command = command_create(DeviceId.userIO, UserIOCommandIds.allLEDs, [0x00, 0x70, rgb.red, rgb.green, rgb.blue]);
            return sphero_chars.get(UUID_SPHERO_CHARACTERISTIC_HANDLE_1C).writeValue(Uint8Array.from(command));
        },
        roll_change: function(){
            console.log("roll_change");
            var heading = parseInt(this.heading_value);
            if( heading < 0 )
                heading += 360;
            var command = command_create(DeviceId.driving, DrivingCommandIds.driveWithHeading, [parseInt(this.speed_value), (heading >> 8) & 0xff, heading & 0xff, 0x01]);
            return sphero_chars.get(UUID_SPHERO_CHARACTERISTIC_HANDLE_1C).writeValue(Uint8Array.from(command));
        }
    },
    mounted: function(){
        console.log('mounted call');
    }
});

var sphero_device = null;
var sphero_chars = new Map();

function onDisconnect(event){
    vue.connected = false;
    console.log('onDisconnect');
}

function onDataChanged(event){
    console.log('onDataChanged');
    let characteristic = event.target;

    /* センサー情報の取得用 */
    let packet = dataview_to_array(characteristic.value);
    decoder_set_data(packet);
}

function set_service_command(server){
    return server.getPrimaryService(UUID_SPHERO_SERVICE_COMMAND)
    .then(service => {
        console.log('Execute : getCharacteristic(command)');
        return Promise.all([
            set_characteristic(service, UUID_SPHERO_CHARACTERISTIC_HANDLE_1C)
        ]);
    });
}

function set_service_initialize(server){
    return server.getPrimaryService(UUID_SPHERO_SERVICE_INITIALIZE)
    .then(service => {
        console.log('Execute : getCharacteristic(initialize)');
        return Promise.all([
            set_characteristic(service, UUID_SPHERO_CHARACTERISTIC_USETHEFORCE),
            set_characteristic(service, UUID_SPHERO_CHARACTERISTIC_SUBSCRIBE),
            set_characteristic(service, UUID_SPHERO_CHARACTERISTIC_READ)
        ]);
    });
}

function set_characteristic(service, characteristicUuid) {
    return service.getCharacteristic(characteristicUuid)
    .then(characteristic => {
        console.log('setCharacteristic : ' + characteristicUuid);
        sphero_chars.set(characteristicUuid, characteristic);
        characteristic.addEventListener('characteristicvaluechanged', onDataChanged );
        return service;
    });
}

function command_push_byte(command, b){
    if( b == APIConstants.startOfPacket || b == APIConstants.endOfPacket || b == APIConstants.escape ){
        command.push(APIConstants.escape);
        command.push( b & ~APIConstants.escapeMask );
    }else{
        command.push(b);
    }
}

var g_counter = 0x00;

/* 0x8d 0x0a deviceid, commandid counter [data] chk 0xd8 */
function command_create(deviceId, commandId, data) {
    g_counter++;

    var sum = 0;
    var command = [];
    command.push(APIConstants.startOfPacket);
    var cmdflg = Flags.requestsResponse | Flags.resetsInactivityTimeout;
    command.push(cmdflg);
    sum += cmdflg;
    command_push_byte(command, deviceId);
    sum += deviceId;
    command_push_byte(command, commandId);
    sum += commandId;
    command_push_byte(command, g_counter);
    sum += g_counter;
    for( var i = 0 ; i < data.length ; i++ ){
        command_push_byte(command, data[i]);
        sum += data[i];
    }
    var chk = (~sum) & 0xff;
    command_push_byte(command, chk);
    command.push(APIConstants.endOfPacket);

    return command;
}

/* センサー情報の取得用 */
var g_callback = null;
var g_mode = 0;
var g_chksum;
var g_response = null;

/* センサー情報の取得用 */
function decoder_set_callback(callback){
    g_mode = 0;
    g_callback = callback;
}

/* センサー情報の取得用 */
function decoder_set_data(data){
    for( var i = 0 ; i < data.length ; i++ )
        decoder_set_byte(data[i]);
}

/* センサー情報の取得用 */
function decoder_set_byte(b){
    if( b == APIConstants.startOfPacket ){
        g_chksum = 0;
        g_mode = 1;
        g_response = [b];
    }else if( g_mode == 0 ){
        return;
    }else if( g_mode == 1 ){
        if( b == APIConstants.escape ){
            g_mode = 2;
        }else if( b == APIConstants.endOfPacket ){
            g_response.push(b);
            if( g_response.length < 3 ){
                console.log('decoder_set_byte: length error');
                g_mode = 0;
                return;
            }
            if( (g_chksum & 0xff) != 0xff ){
                g_mode = 0;
                console.log('decoder_set_byte: chksum error');
                return;
            }
            if( g_callback != null )
                g_callback(g_response);
            g_mode = 0;
        }else{
            g_response.push(b);
            g_chksum += b;
        }
    }else if( g_mode == 2 ){
        g_response.push( b | APIConstants.escapeMask );
        g_chksum += b | APIConstants.escapeMask;
        mode = 1;
    }
}

/* センサー情報の取得用 */
function cb_receive_packet(packet){
    console.log('cb_receive_packet');
    if( packet[2] == DeviceId.sensor && packet[3] == SensorCommandIds.sensorResponse){
        // todo : parse sensor data
    }
}

/* センサー情報の取得用 */
function dataview_to_array(array){
    var result = new Array(array.byteLength);
    for( var i = 0 ; i < array.byteLength ; i++ )
        result[i] = array.getUint8(i);

    return result;
}

function rgb_hex2bin(rgb) {
    var offset = 0;
    if(rgb.substring(0,1) == '#')
        offset++;

    var rgbbin = {};
    rgbbin.red = parseInt(rgb.substring(offset, offset + 2), 16);
    rgbbin.green = parseInt(rgb.substring(offset + 2, offset + 4), 16);
    rgbbin.blue = parseInt(rgb.substring(offset + 4, offset + 6), 16);

    return rgbbin;
}