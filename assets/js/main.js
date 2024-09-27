
import data from "../database/songs.js"

const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const PlAYER_STORAGE_KEY = 'KEY_MUSIC'

const player = $('.player')
const heading = $('header h2')
const cdThumb = $('.cd-thumb')
const audio = $('#audio')
const playBtn = $('.btn-toggle-play')
const nextBtn = $('.btn-next')
const prevBtn = $('.btn-prev')
const randomBtn = $('.btn-random')
const repeatBtn = $('.btn-repeat')
const playlist = $('.playlist')
const cd = $('.cd')

// SEARCH
const searchBox = $('.search-box')
const searchInput = $('.search-bar')
const searchSongs = $('.search-songs')

// Mảng chứa index bài hát đã chạy random
let randomFilter = []
// Biến lưu query tất cả bài hát ở playlist để thực hiện searching
let songsList

const app = {
    currentIndex: 0,
    isPlaying: false,
    isRandom: false,
    isRepeat: false,
    config: JSON.parse(localStorage.getItem(PlAYER_STORAGE_KEY)) || {},

    songs: data.songs,

    setConfig: function (key, value) {
        this.config[key] = value
        localStorage.setItem(PlAYER_STORAGE_KEY, JSON.stringify(this.config))
    },


    render: function () {
        const htmls = this.songs.map((song, index) => {
            return `
            <div class="song-node">
                <div class="song ${index === this.currentIndex ? 'active' : ''}" data-index="${index}">
                    <div class="thumb" 
                        style="background-image: url('${song.image}')">
                    </div>
                    <div class="body">
                        <h3 class="title">${song.name}</h3>
                        <p class="author">${song.singer}</p>
                    </div>
                    <div class="option">
                        <i class="fas fa-ellipsis-v"></i>
                    </div>
                </div>
            </div>
            `
        })
        playlist.innerHTML = htmls.join('')
    },

    defineProperties: function () {
        Object.defineProperty(this, 'currentSong', {
            get: function () {
                return this.songs[this.currentIndex];
            }
        })
    },
    // Chuẩn hóa tên bài hát
    removeAccents: function (str) {
        return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    },


    handleEvents: function () {

        const cdWidth = cd.offsetWidth
        const _this = this

        //Xử lý CD quay
        const cdThumbAnimate = cdThumb.animate([{
            transform: 'rotate(360deg)'
        }], {
            duration: 10000,
            iterations: Infinity
        })
        cdThumbAnimate.pause()


        //Xử lý CD 
        document.onscroll = function () {
            const scrollTop = window.scrollY || document.documentElement.scrollTop
            const newCdWidth = cdWidth - scrollTop

            cd.style.width = newCdWidth > 0 ? newCdWidth + 'px' : 0
            cd.style.opacity = newCdWidth / cdWidth
        }

        //Tìm kiếm
        searchBox.onclick = function () {
            searchSongs.style.display = 'block'
            searchInput.setAttribute('style', 'border-bottom-right-radius: 0; border-bottom-left-radius: 0')

            // Biến lưu query tất cả bài hát ở playlist để thực hiện search
            songsList = $$('.song-node')
        }

        document.addEventListener('click', function (event) {
            const isClickInside = searchBox.contains(event.target) || searchInput.contains(event.target);
            if (!isClickInside) {
                searchSongs.style.display = 'none'; 
                searchInput.value = ''; 
                searchSongs.innerHTML = ''; 
                //Đặt lại boder null
                searchInput.style.borderBottomRightRadius = null; 
                searchInput.style.borderBottomLeftRadius = null;
            }
        });

        searchInput.oninput = function () {
            let searchValue = searchInput.value
            if (!searchValue) {
                searchSongs.innerHTML = ''
                return
            }
            let searchResult = []
            songsList.forEach(song => {
                let copySong = song.cloneNode(true)
                let songInfo = _this.removeAccents(copySong.innerText).toUpperCase()
                searchValue = _this.removeAccents(searchValue).toUpperCase()
                if (songInfo.includes(searchValue)) {
                    searchResult.push(copySong.innerHTML)
                }
            })
            searchSongs.innerHTML = searchResult.join('')
        }
        searchSongs.onclick = (e) => {
            playlist.onclick(e)
        }


        //Xử lý khi ấn play
        playBtn.onclick = function () {
            if (_this.isPlaying) {
                audio.pause()
            } else {
                audio.play()
            }
        }

        //Xử lý khi nhạc chạy
        audio.onplay = function () {
            _this.isPlaying = true
            player.classList.add('playing')
            cdThumbAnimate.play()
        }

        //Xử lý khi nhạc dừng
        audio.onpause = function () {
            _this.isPlaying = false
            player.classList.remove('playing')
            cdThumbAnimate.pause()
        }

        //Tiến độ bài hát thay đổi
        audio.ontimeupdate = function () {
            if (audio.duration) {
                // Percent of progress
                const progressPercent = (audio.currentTime / audio.duration) * 100
                progress.value = progressPercent
                _this.setConfig('songCurrentTime', audio.currentTime)
                _this.setConfig('songProgressValue', progress.value)
            }
        }

        //Xử lý khi tua nhạc
        let isSeeking = false;
        let seekTimeout;

        // Cập nhật xử lý tìm kiếm
        progress.oninput = function (e) {
            // Xóa timeout trước đó nếu nó vẫn còn hoạt động
            clearTimeout(seekTimeout);

            // Đặt trạng thái đang tua
            isSeeking = true;

            const seekValue = e.target.value;
            const seekTime = audio.duration / 100 * seekValue;

            // Cập nhật audio.currentTime chỉ sau khi người dùng dừng kéo thanh trượt
            seekTimeout = setTimeout(() => {
                audio.currentTime = seekTime;
                isSeeking = false;
            }, 200); 
        };

        // Cập nhật tiến trình khi bài hát đang phát
        audio.ontimeupdate = function () {
            if (audio.duration && !isSeeking) {
                const progressPercent = (audio.currentTime / audio.duration) * 100;
                progress.value = progressPercent;
                app.setConfig('songCurrentTime', audio.currentTime);
                app.setConfig('songProgressValue', progress.value);
            }
        };

        //Chuyển tiếp bài hát
        nextBtn.onclick = function () {
            if (_this.isRandom) {
                _this.playRandomSong()
            } else {
                _this.nextsong()
            }
            audio.play()
            _this.render()
            _this.scrollToActiveSong()
        }

        //Trở lại bài hát trước
        prevBtn.onclick = function () {
            if (_this.isRandom) {
                _this.playRandomSong()
            } else {
                _this.prevsong()
            }
            audio.play()
            _this.render()
        }

        //Phát ngẫu nhiên bài hát
        randomBtn.onclick = function () {

            _this.isRandom = !_this.isRandom
            _this.setConfig('isRandom', _this.isRandom)
            randomBtn.classList.toggle('active', _this.isRandom)
            repeatBtn.classList.remove('active', _this.isRepeat)
        }

        //Lap lai bai hat
        repeatBtn.onclick = function () {
            _this.isRepeat = !_this.isRepeat
            _this.setConfig('isRepeat', _this.isRepeat)
            repeatBtn.classList.toggle('active', _this.isRepeat)
            randomBtn.classList.remove('active', _this.isRandom)
        }

        //Xử lý khi bài hát kết thúc
        audio.onended = function () {
            if (_this.isRepeat) {
                audio.play();
            } else if (_this.isRandom) {
                _this.playRandomSong();
                audio.play()
            } else {
                _this.nextsong();
                audio.play()
            }
        };

        //Lắng nghe click vào playlist 
        playlist.onclick = function (e) {
            const songNode = e.target.closest('.song:not(.active)')
            const songOption = e.target.closest('.option')

            if (songNode || songOption) {
                //click in song
                if (songNode) {
                    _this.currentIndex = Number(songNode.dataset.index)
                    _this.loadCurrentSong()
                    _this.render()
                    audio.play()
                }
            }

            //click in song option
            if (songOption) {

            }
        }
    },
    //Cuộn tới vị trí bài hát đang phát
    scrollToActiveSong: function () {
        setTimeout(() => {
            $('.playlist .song.active').scrollIntoView({
                behavior: 'smooth',
                block: 'end',
                inline: 'nearest'
            })
        }, 300)
    },

    loadCurrentSong: function () {
        // Load Song Info
        heading.textContent = this.currentSong.name
        cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`
        audio.src = this.currentSong.path

        //Thêm active cho bài hát trong playlist
        const activeSongs = $$('.song.active')
        const currentActiveSongs = $$(`.song[data-index= "${this.currentIndex}"]`)
        currentActiveSongs.forEach(activeSong => {
            activeSong.classList.add('active')
        })
        activeSongs.forEach(activeSong => {
            if (activeSong && activeSong.classList.contains('active')) {
                activeSong.classList.remove('active')
            }
        });

        // Lưu bài hát hiện tại vào localStorage
        this.setConfig('currentSongIndex', this.currentIndex)
        // Cuộn tới bài hát
        this.scrollToActiveSong()
    },

    loadConfig: function () {
        this.isRandom = this.config.isRandom || false;
        this.isRepeat = this.config.isRepeat || false;
        randomBtn.classList.toggle('active', this.isRandom);
        repeatBtn.classList.toggle('active', this.isRepeat);
        this.currentIndex = this.config.currentSongIndex || 0;
        progress.value = this.config.songProgressValue || 0;
        audio.currentTime = this.config.songCurrentTime || 0;
    },

    nextsong: function () {
        this.currentIndex++
        if (this.currentIndex >= this.songs.length) {
            this.currentIndex = 0
        }
        this.loadCurrentSong()
    },

    prevsong: function () {
        this.currentIndex--
        if (this.currentIndex < 0) {
            this.currentIndex = this.songs.length - 1
        }
        this.loadCurrentSong()
    },

    playRandomSong: function () {

        if (this.songs.length < 2) return
        let newIndex = this.currentIndex

        if (randomFilter.length == 0) {
            randomFilter.push(this.currentIndex)
        } else if (randomFilter.length == this.songs.length) {
            randomFilter.length = 0
            randomFilter.push(this.currentIndex)
        }

        do {
            newIndex = Math.floor(Math.random() * this.songs.length)
        } while (randomFilter.includes(newIndex))

        this.currentIndex = newIndex
        this.loadCurrentSong()
        randomFilter.push(this.currentIndex)
        audio.play()

    },

    sortSongsByName: function () {
        this.songs.sort((a, b) => {
            const nameA = this.removeAccents(a.name.toUpperCase());
            const nameB = this.removeAccents(b.name.toUpperCase());
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            return 0;
        });
    },


    start: function () {
        //Định nghĩa các thuộc tính cho object
        this.defineProperties()
        //Gắn cấu hình từ config vào app
        this.loadConfig()
        //lắng nghe và xử lý các sự kiện (DOM events)
        this.handleEvents()
        //load thông tin bài hát đầu tiên
        this.loadCurrentSong()
        //Sắp xếp playlist
        this.sortSongsByName();
        //Render playlist
        this.render()
    }
}

app.start()
