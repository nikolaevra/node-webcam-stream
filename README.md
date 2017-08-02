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