if you want to [stream to youtube or facebook live](https://www.digikey.com/en/maker/blogs/streaming-live-to-youtube-and-facebook-using-raspberry-pi-camera/969a7932d47d42a79ba72c81da4d9b66)

trying to follow this tutorial: `http://weheart.digital/build-simple-live-streaming-solution/`

### How to setup computer: 

#### Install ffmpeg from source

Alternatively, you can install from source. This is how to create a .deb file using checkinstall which can then be uninstalled again. Install these packages, yasm or nasm is needed for ffmpeg specifically, the others are generally useful for building packages:

```
sudo apt-get install yasm nasm \
               build-essential automake autoconf \
               libtool pkg-config libcurl4-openssl-dev \
               intltool libxml2-dev libgtk2.0-dev \
               libnotify-dev libglib2.0-dev libevent-dev \
               checkinstall\
```
Next, clone the ffmpeg package or download the latest snapshot:

```
git clone git://git.videolan.org/ffmpeg.git
```
or
```
wget https://www.ffmpeg.org/releases/ffmpeg-snapshot.tar.bz2
tar jxvf ffmpeg-snapshot.tar.bz2
```
Compile ffmpeg:

```
cd ffmpeg
./configure --prefix=/usr
time make -j 8
cat RELEASE
sudo checkinstall
```
Most of the checkinstall defaults are fine, but a version number is required. The current version is displayed by "cat RELEASE". This should create a deb file in the current directory.

Finally, install the deb file you made using dpkg:

`sudo dpkg --install ffmpeg_*.deb`


#### Start the stream:

For this example, ffmpeg and the WebSocket relay run on the same system. This allows you to view the stream in your local network, but not on the public internet.

This example assumes that your webcam is compatible with Video4Linux2 and appears as `/dev/video0` in the filesystem. Most USB webcams support the UVC standard and should work just fine. The onboard Raspberry Camera can be made available as V4L2 device by loading a kernel module: `sudo modprobe bcm2835-v4l2`.


1) Install ffmpeg (See [How to install ffmpeg on Debian / Raspbian](http://superuser.com/questions/286675/how-to-install-ffmpeg-on-debian)). Using ffmpeg, we can capture the webcam video & audio and encode it into MPEG1/MP2.

2) Install Node.js and npm (See [Installing Node.js on Debian and Ubuntu based Linux distributions](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions) for newer versions). The Websocket relay is written in Node.js

3) Install http-server. We will use this to serve the static files (view-stream.html, jsmpeg.min.js), so that we can view the website with the video in our browser. Any other webserver would work as well (nginx, apache, etc.):
`sudo npm -g install http-server`

4) Install git and clone this repository (or just download it as ZIP and unpack)
```
sudo apt-get install git
git clone https://github.com/phoboslab/jsmpeg.git
```

5) Change into the jsmpeg/ directory
`cd jsmpeg/`

6) Install the Node.js Websocket Library:
`npm install ws`

7) Start the Websocket relay. Provide a password and a port for the incomming HTTP video stream and a Websocket port that we can connect to in the browser:
`node websocket-relay.js supersecret 8081 8082`

8) In a new terminal window (still in the `jsmpeg/` directory, start the `http-server` so we can serve the view-stream.html to the browser:
`http-server`

9) Open the streaming website in your browser. The `http-server` will tell you the ip (usually `192.168.[...]`) and port (usually `8080`) where it's running on:
`http://192.168.[...]:8080/view-stream.html`

10) In a third terminal window, start ffmpeg to capture the webcam video and send it to the Websocket relay. Provide the password and port (from step 7) in the destination URL:
```
ffmpeg \
	-f v4l2 \
		-framerate 25 -video_size 640x480 -i /dev/video0 \
	-f mpegts \
		-codec:v mpeg1video -s 640x480 -b:v 1000k -bf 0 \
	http://localhost:8081/supersecret
```

You should now see a live webcam image in your browser. 

If ffmpeg failed to open the input video, it's likely that your webcam does not support the given resolution, format or framerate. To get a list of compatible modes run:

`ffmpeg -f v4l2 -list_formats all -i /dev/video0`


To add the webcam audio, just call ffmpeg with two separate inputs.

```
ffmpeg \
	-f v4l2 \
		-framerate 25 -video_size 640x480 -i /dev/video0 \
	-f alsa \
		-ar 44100 -c 2 -i hw:0 \
	-f mpegts \
		-codec:v mpeg1video -s 640x480 -b:v 1000k -bf 0 \
		-codec:a mp2 -b:a 128k \
		-muxdelay 0.001 \
	http://localhost:8081/supersecret
```

Note the `muxdelay` argument. This should reduce lag, but doesn't always work when streaming video and audio - see remarks below.

