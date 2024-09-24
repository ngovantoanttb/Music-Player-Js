// Một số bài hát có thể bị lỗi do liên kết bị hỏng. Vui lòng thay thế liên kết khác để có thể phát
// Some songs may be faulty due to broken links. Please replace another link so that it can be played

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

const app = {
    currentIndex: 0,
    isPlaying: false,
    isRandom: false,
    isRepeat: false,
    config: JSON.parse(localStorage.getItem(PlAYER_STORAGE_KEY)) || {},

    songs: [{
            name: 'Ải hồng nhan ',
            singer: '',
            path: '/assets/music/aihongnhan.mp3',
            image: '/assets/img/aihongnhan.jpg'
        },
        {
            name: 'À lôi',
            singer: '',
            path: '/assets/music/aloi.mp3',
            image: '/assets/img/aloi.jpg'
        },
        {
            name: 'Cưới thôi em',
            singer: '',
            path: '/assets/music/cuoithoiem.mp3',
            image: '/assets/img/cuoithoiem.jpg'
        },
        {
            name: 'Đi giữa trời rực rỡ',
            singer: '',
            path: '/assets/music/digiuatroirucro.mp3',
            image: '/assets/img/digiuatroirucro.jpg'
        },
        {
            name: 'Đừng làm trái tim anh đau',
            singer: '',
            path: '/assets/music/dunglamtraitimanhdau.mp3',
            image: '/assets/img/dunglamtraitimanhdau.jpg'
        },
        {
            name: 'Em là chân ái',
            singer: '',
            path: '/assets/music/emlachanai.mp3',
            image: '/assets/img/emlachanai.jpg'
        },
        {
            name: 'Giang hải không độ nàng',
            singer: '',
            path: '/assets/music/gianghai.mp3',
            image: '/assets/img/gianghai.jpg'
        },
        {
            name: 'Rồi ta sẽ ngắm pháo hoa cùng nhau',
            singer: '',
            path: '/assets/music/ngamphaohoa.mp3',
            image: '/assets/img/ngamphaohoa.jpg'
        }
    ],

    setConfig: function(key, value) {
        this.config[key] = value
        localStorage.setItem(PlAYER_STORAGE_KEY, JSON.stringify(this.config))
    },


    render: function() {
        const htmls = this.songs.map((song, index) => {
            return `
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
            `
        })
        playlist.innerHTML = htmls.join('')
    },

    defineProperties: function() {
        Object.defineProperty(this, 'currentSong', {
            get: function() {
                return this.songs[this.currentIndex];
            }
        })
    },

    handleEvents: function() {
        const cdWidth = cd.offsetWidth
        const _this = this

        //Xu ly CD quay
        const cdThumbAnimate = cdThumb.animate([{
            transform: 'rotate(360deg)'
        }], {
            duration: 10000,
            iterations: Infinity
        })
        cdThumbAnimate.pause()
            //Xu ly CD
        document.onscroll = function() {
            const scrollTop = window.scrollY || document.documentElement.scrollTop
            const newCdWidth = cdWidth - scrollTop

            cd.style.width = newCdWidth > 0 ? newCdWidth + 'px' : 0
            cd.style.opacity = newCdWidth / cdWidth
        }

        //Xu ly click play
        playBtn.onclick = function() {
            if (_this.isPlaying) {
                audio.pause()
            } else {
                audio.play()
            }
        }

        //When Play song
        audio.onplay = function() {
            _this.isPlaying = true
            player.classList.add('playing')
            cdThumbAnimate.play()
        }

        //When Pause song
        audio.onpause = function() {
            _this.isPlaying = false
            player.classList.remove('playing')
            cdThumbAnimate.pause()
        }

        //Tien do bai hat thay doi
        audio.ontimeupdate = function() {
            if (audio.duration) {
                const progressPercent = Math.floor(audio.currentTime / audio.duration * 100)
                progress.value = progressPercent
            }
        }

        //Xu ly tua 
        progress.onchange = function(e) {
            const seekTime = audio.duration / 100 * e.target.value
            audio.currentTime = seekTime
        }

        //Next song
        nextBtn.onclick = function() {
            if (_this.isRandom) {
                _this.playRandomSong()
            } else {
                _this.nextsong()
            }
            audio.play()
            _this.render()
            _this.scrollToActiveSong()
        }

        //Prev Song
        prevBtn.onclick = function() {
            if (_this.isRandom) {
                _this.playRandomSong()
            } else {
                _this.prevsong()
            }
            audio.play()
            _this.render()
        }

        //Random song
        randomBtn.onclick = function() {
            _this.isRandom = !_this.isRandom
            _this.setConfig('isRandom', _this.isRandom)
            randomBtn.classList.toggle('active', _this.isRandom)


            if (_this.isRandom) {
                _this.playRandomSong();
                repeatBtn.classList.remove('active')
                audio.play();
            }
        }

        //Lap lai bai hat
        repeatBtn.onclick = function() {
            _this.isRepeat = !_this.isRepeat
            _this.setConfig('isRepeat', _this.isRepeat)
            repeatBtn.classList.toggle('active', _this.isRepeat)
            randomBtn.classList.remove('active')
        }

        // When song ends
        audio.onended = function() {
            if (_this.isRepeat) {
                audio.play();
            } else if (_this.isRandom) {
                _this.playRandomSong();
            } else {
                _this.nextsong();
            }
        };

        //Lang nghe click vao playlist
        playlist.onclick = function(e) {
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

    scrollToActiveSong: function() {
        setTimeout(() => {
            $('.song.active').scrollIntoView({
                behavior: 'smooth',
                block: 'end',
                inline: 'nearest'
            })
        }, 300)
    },

    loadCurrentSong: function() {
        heading.textContent = this.currentSong.name
        cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`
        audio.src = this.currentSong.path
    },

    loadConfig: function() {
        this.isRandom = this.config.isRandom
        this.isRepeat = this.config.isRepeat
    },

    nextsong: function() {
        this.currentIndex++
            if (this.currentIndex >= this.songs.length) {
                this.currentIndex = 0
            }
        this.loadCurrentSong()
    },

    prevsong: function() {
        this.currentIndex--
            if (this.currentIndex < 0) {
                this.currentIndex = this.songs.length - 1
            }
        this.loadCurrentSong()
    },

    playRandomSong: function() {
        let newIndex
        do {
            newIndex = Math.floor(Math.random() * this.songs.length)
        }
        while (newIndex === this.curentIndex)
        this.currentIndex = newIndex
        this.loadCurrentSong()

    },

    start: function() {
        //Gan cau hinh tu config vao app
        this.loadConfig()
        //định nghĩa các thuộc tính cho object
        this.defineProperties()

        //lắng nghe và xử lý các sự kiện (DOM events)
        this.handleEvents()

        //upload info first song when run app 
        this.loadCurrentSong()

        //Render playlist
        this.render()

        // Lấy lại cấu hình từ localStorage
        // randomBtn.classList.toggle('active', this.isRandom)
        // repeatBtn.classList.toggle('active', this.isRepeat)

    }
}

app.start()
