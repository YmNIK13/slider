/**
 * @link https://habr.com/ru/post/501258/
 */
class Swiper {

    /** @type {RegExp} -  Регулярка для получения пикселей */
    static #trfRegExp = /[-0-9.]+(?=px)/

    /** @type {Object} -  Слайдер */
    #$slider
    /** @type {Object} -  Видимое окно слайдера */
    #$sliderList
    /** @type {Object} -  Лента слайдов */
    #$sliderTrack
    /** @type {Object} -  Массив слайдов */
    #$slides

    /** @type {Object} -  Кнопка предыдущего слайда */
    #$prev
    /** @type {Object} -  Кнопка следующего слайда  */
    #$next


    /** @type {number} -  текущий слайд */
    #slideIndex = 0

    /** @type {number} -  Ширина слайдов */
    #slideWidth = 200


    /** @type {number} - Начальная позиция курсора, статична */
    #posInit = 0

    /** @type {number} - Текущая позиция курсора, динамично */
    #posX1 = 0
    /** @type {number} - Текущее смещение курсора, динамично */
    #posX2 = 0

    #posY1 = 0
    #posY2 = 0

    /** @type {number} - Финальная точна смещения */
    #posFinal = 0

    /** @type {number} - допустимое смещение для игнора слайда */
    #posThreshold = 0


    #isSwipe = false
    #isScroll = false

    #allowSwipe = true
    #transition = true

    #nextTrf = 0
    #prevTrf = 0
    #lastTrf


    #swipeStart = (e) => this.swipeStart(e, this)
    #swipeActionHandler = (e) => this.swipeAction(e, this)
    #swipeEndHandler = (e) => this.swipeEnd(e, this)
    #clickArrowHandler = (e) => this.clickArrow(e, this)

    constructor(slider) {
        this.#$slider = slider

        this.#$sliderList = this.#$slider.querySelector('.slider-list')
        this.#$sliderList.classList.add('grab');

        this.#$sliderTrack = this.#$slider.querySelector('.slider-track')
        this.#$sliderTrack.style.transform = `translate3d(0px, 0px, 0px)`

        this.#$slides = this.#$slider.querySelectorAll('.slide')

        this.#slideWidth = this.#$slides[0].offsetWidth
        this.#posThreshold = this.#slideWidth * 0.35;

        let slidesLength = this.#$slides.length
        this.#lastTrf = --slidesLength * this.#slideWidth

        const arrows = this.#$slider.querySelector('.slider-arrows')
        this.#$prev = arrows.children[0];
        this.#$next = arrows.children[1];


        this.#$slider.addEventListener('touchstart', this.#swipeStart)
        this.#$slider.addEventListener('mousedown', this.#swipeStart)

        this.#$sliderTrack.addEventListener('transitionend', () => this.#allowSwipe = true)

        arrows.addEventListener('click', this.#clickArrowHandler)
    }


    /**
     *  Обертка над событием, так как для тач-пада идет обработка касаний то там массив, а для мышки - напрямую
     * @param e
     * @returns {*}
     */
    getEvent(e) {
        return e.type.search('touch') !== -1 ? e.touches[0] : e;
    }

    // начало свайпа
    swipeStart(e) {
        let evt = this.getEvent(e)
        console.log('swipeStart - ' + evt.clientX)

        //если нет блокировки
        if (this.#allowSwipe) {
            this.#transition = true

            // отсекаем крайние движения
            this.#nextTrf = (this.#slideIndex + 1) * -this.#slideWidth
            this.#prevTrf = (this.#slideIndex - 1) * -this.#slideWidth

            this.#posInit = this.#posX1 = evt.clientX
            // отслеживаем по вертикали
            this.#posY1 = evt.clientY;

            // убираем плавный переход, чтобы track двигался за курсором без задержки т.к. он будет включается в функции slide()
            this.#$sliderTrack.style.transition = '';

            // и сразу начинаем отслеживать другие события на документе
            document.addEventListener('touchmove', this.#swipeActionHandler)
            document.addEventListener('mousemove', this.#swipeActionHandler)
            document.addEventListener('touchend', this.#swipeEndHandler)
            document.addEventListener('mouseup', this.#swipeEndHandler)

            // Указатель реки
            this.#$sliderList.classList.remove('grab');
            this.#$sliderList.classList.add('grabbing');
        }
    }

    /**
     * Во время свайпа. В этой функции мы изменяем свойство transform
     *
     * @param e - параметры события
     */
    swipeAction(e) {
        let evt = this.getEvent(e)
        console.log('swipeAction - ' + evt.clientX)

        // для более красивой записи возьмем в переменную текущее свойство transform
        let style = this.#$sliderTrack.style.transform,
            // считываем трансформацию с помощью регулярного выражения и сразу превращаем в число
            transform = +style.match(Swiper.#trfRegExp)[0];


        this.#posX2 = this.#posX1 - evt.clientX;
        this.#posX1 = evt.clientX


        this.#posY2 = this.#posY1 - evt.clientY;
        this.#posY1 = evt.clientY


        // определение действия свайп или скролл
        if (!this.#isSwipe && !this.#isScroll) {
            let posY = Math.abs(this.#posY2);
            if (posY > 7 || this.#posX2 === 0) {
                this.#isScroll = true;
                this.#allowSwipe = false;
            } else if (posY < 7) {
                this.#isSwipe = true;
            }
        }

        if (this.#isSwipe) {
            // запрет ухода влево на первом слайде
            if (this.#slideIndex === 0) {
                if (this.#posInit < this.#posX1) {
                    this.setTransform(transform, 0);
                    return;
                } else {
                    this.#allowSwipe = true;
                }
            }

            // запрет ухода вправо на последнем слайде
            let slidesLength = this.#$slides.length
            if (this.#slideIndex === --slidesLength) {
                if (this.#posInit > this.#posX1) {
                    this.setTransform(transform, this.#lastTrf);
                    return;
                } else {
                    this.#allowSwipe = true;
                }
            }

            // запрет протаскивания дальше одного слайда
            if (this.#posInit > this.#posX1
                && transform < this.#nextTrf
                || this.#posInit < this.#posX1
                && transform > this.#prevTrf) {

                this.reachEdge();
                return;
            }

            this.#$sliderTrack.style.transform = `translate3d(${transform - this.#posX2}px, 0px, 0px)`;
            // можно было бы использовать метод строк .replace():
            // this.#$sliderTrack.style.transform = style.replace(Swiper.#trfRegExp, match => match - this.#posX2);
            // но в дальнейшем нам нужна будет текущая трансформация в переменной
        }
    }

    // конец свайпа
    swipeEnd() {
        console.log('swipeEnd')
        // финальная позиция курсора
        this.#posFinal = this.#posInit - this.#posX1

        this.#isScroll = false;
        this.#isSwipe = false;

        // Отписываемся
        document.removeEventListener('touchmove', this.#swipeActionHandler);
        document.removeEventListener('mousemove', this.#swipeActionHandler);
        document.removeEventListener('touchend', this.#swipeEndHandler);
        document.removeEventListener('mouseup', this.#swipeEndHandler);

        this.#$sliderList.classList.add('grab');
        this.#$sliderList.classList.remove('grabbing');

        if (this.#allowSwipe) {
            // убираем знак минус и сравниваем с порогом сдвига слайда
            if (Math.abs(this.#posFinal) > this.#posThreshold) {
                if (this.#posInit < this.#posX1) {
                    // если мы тянули вправо, то уменьшаем номер текущего слайда
                    this.#slideIndex--;
                } else if (this.#posInit > this.#posX1) {
                    // если мы тянули влево, то увеличиваем номер текущего слайда
                    this.#slideIndex++;
                }
            }

            // если курсор двигался, то запускаем функцию переключения слайдов
            if (this.#posInit !== this.#posX1) {
                this.slide();
            }
        } else {
            this.#allowSwipe = true;
        }
    }

    clickArrow(e) {
        let target = e.target;

        if (target === this.#$next) {
            this.#slideIndex++;
        } else if (target === this.#$prev) {
            this.#slideIndex--;
        } else {
            return;
        }

        this.slide();
    }


    /**
     * Ручное перетаскивание слайда
     */
    slide() {
        // устанавливаем стили для плавного движения
        this.#$sliderTrack.style.transition = 'transform .5s'
        this.#$sliderTrack.style.transform = `translate3d(-${this.#slideIndex * this.#slideWidth}px, 0px, 0px)`

        // делаем стрелку prev недоступной на первом слайде и доступной в остальных случаях
        this.#$prev.classList.toggle('disabled', this.#slideIndex === 0);
        // делаем стрелку next недоступной на последнем слайде и доступной в остальных случаях
        let countSlide = this.#$slides.length
        this.#$next.classList.toggle('disabled', this.#slideIndex === --countSlide);
    }


    setTransform(transform, comapreTransform) {
        if (transform >= comapreTransform) {
            if (transform > comapreTransform) {
                this.#$sliderTrack.style.transform = `translate3d(${comapreTransform}px, 0px, 0px)`;
            }
        }
        this.#allowSwipe = false;
    }

    reachEdge() {
        this.#transition = false;
        this.swipeEnd();
        this.#allowSwipe = true;
    }

}

window.Swiper = Swiper;

