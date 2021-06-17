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

    /** @type {number} - Финальная точна смещения */
    #posFinal = 0

    /** @type {number} - допустимое смещение для игнора слайда */
    #posThreshold = 0


    #swipeStart = (e) => this.swipeStart(e, this)
    #swipeActionHandler = (e) => this.swipeAction(e, this)
    #swipeEndHandler = (e) => this.swipeEnd(e, this)

    constructor(slider) {
        this.#$slider = slider
        this.#$sliderList = this.#$slider.querySelector('.slider-list')
        this.#$sliderTrack = this.#$slider.querySelector('.slider-track')
        this.#$sliderTrack.style.transform = `translate3d(0px, 0px, 0px)`

        this.#$slides = this.#$slider.querySelectorAll('.slide')

        const arrows = this.#$slider.querySelector('.slider-arrows')
        this.#$prev = arrows.children[0];
        this.#$next = arrows.children[1];

        this.#slideWidth = this.#$slides[0].offsetWidth
        this.#posThreshold = this.#slideWidth * 0.35;

        this.#$slider.addEventListener('touchstart', this.#swipeStart)
        this.#$slider.addEventListener('mousedown',  this.#swipeStart)
    }


    /**
     *  Обертка над событием, так как для тач-пада идет обработка касаний то там массив, а для мышки лежит напрямую
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

        this.#posInit = this.#posX1 = evt.clientX

        // убираем плавный переход, чтобы track двигался за курсором без задержки т.к. он будет включается в функции slide()
        this.#$sliderTrack.style.transition = '';

        // и сразу начинаем отслеживать другие события на документе
        document.addEventListener('touchmove', this.#swipeActionHandler)
        document.addEventListener('mousemove', this.#swipeActionHandler)
        document.addEventListener('touchend', this.#swipeEndHandler)
        document.addEventListener('mouseup', this.#swipeEndHandler)
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

        this.#$sliderTrack.style.transform = `translate3d(${transform - this.#posX2}px, 0px, 0px)`;
        // можно было бы использовать метод строк .replace():
        // this.#$sliderTrack.style.transform = style.replace(Swiper.#trfRegExp, match => match - this.#posX2);
        // но в дальнейшем нам нужна будет текущая трансформация в переменной
    }

    // конец свайпа
    swipeEnd() {
        // Отписываемся
        document.removeEventListener('touchmove', this.#swipeActionHandler);
        document.removeEventListener('mousemove', this.#swipeActionHandler);
        document.removeEventListener('touchend', this.#swipeEndHandler);
        document.removeEventListener('mouseup', this.#swipeEndHandler);

        console.log('swipeEnd')
        // финальная позиция курсора
        this.#posFinal = this.#posInit - this.#posX1


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

    nextSlide() {
        console.log('nextSlide')
    }

    prevSlide() {
        console.log('prevSlide')
    }

    currentSlide() {
        console.log('currentSlide')
    }
}

window.Swiper = Swiper;

