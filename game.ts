type EventHandler = (event: MouseEvent | Event) => void;

type BoardTriggers = {
  onClick: (
    timeStamp: number,
    currentLevel: number,
    currentStep: number,
    correct: boolean
  ) => void;
  onFinishRound: (won: boolean) => void;
};

function delay(timout: number, callback: Function) {
  setTimeout(callback, timout);
}

class Base {
  protected disposables: Function[] = [];

  constructor(public element: HTMLElement) {}

  protected onClick(e: Event): void {
    const { nodeName, className } = e.currentTarget as HTMLElement;
    console.log(this.constructor.name, { nodeName, className });
    e.stopPropagation();
  }

  public show() {
    this.element.classList.toggle('hidden', false);
  }

  public hide() {
    this.element.classList.toggle('hidden', true);
  }

  public dispose() {
    this.disposables.forEach((d) => d && d());
    this.element.remove();
    this.element = null;
  }
}

class Stage extends Base {
  constructor(parent: HTMLElement) {
    super(document.createElement('div'));
    this.element.className = 'grid-container';
    parent.appendChild(this.element);
  }
}

class Card extends Base {
  private handlingClick: boolean = false;

  constructor(
    parent: HTMLElement,
    public readonly index: number,
    private clickHandler: EventHandler | null
  ) {
    super(document.createElement('div'));

    this.element.className = 'grid-item';

    if (this.clickHandler) {
      this.element.classList.add('hoverable');

      let clickEvent = (e: MouseEvent) => this.onClick(e);
      this.element.addEventListener('click', clickEvent);
      this.disposables.push(() =>
        this.element.removeEventListener('click', clickEvent)
      );

      this.disposables.push(() => (this.clickHandler = null));
    }

    this.toggleContent();

    parent.appendChild(this.element);
  }

  protected onClick(e: MouseEvent): void {
    super.onClick(e);
    if (this.handlingClick || this.handlingClick == null) return;

    this.handlingClick = true;

    this.clickHandler!(e);

    this.handlingClick = false;
  }

  public dispose() {
    super.dispose();
  }

  public toggleContent(on: boolean = false) {
    this.element.classList.toggle('active', on);
  }
}

export class Game {
  private readonly cards: Card[] = [];
  private stage!: Stage;

  private currentIndex: number = 0;
  private currentStep: number = 0;
  private currentLevel: number = 0;

  private readonly sequence: any[] = [];

  private readonly metric: any[] = [];

  constructor(
    private readonly appDiv: HTMLElement,
    private readonly triggers: BoardTriggers
  ) {}

  public setup(level: number) {
    this.stage && this.stage.dispose();
    this.stage = new Stage(this.appDiv);
    this.stage.show();

    this.metric.splice(0, this.metric.length);
    this.cards.splice(0, 9);
    for (let i = 0; i < 9; i++) {
      const card = new Card(this.stage.element, i, null);
      this.cards.push(card);
    }
    for (let i = 0; i < level + 1; i++) {
      let index = Math.floor(Math.random() * 9);
      this.sequence[i] = { index, level };
    }

    console.log('seq', {
      level,
      seq: JSON.stringify(this.sequence.map((a) => a.index + 1)),
    });

    this.currentLevel = level;
    this.currentStep = 0;
    this.currentIndex = this.sequence[this.currentStep].index;
  }

  public preview(i = 0) {
    delay(1000, () => {
      if (i < this.sequence.length) {
        const { index, level } = this.sequence[i];
        this.cards[index].toggleContent(true);
        delay(1000 - 100 * level, () => {
          this.cards[index].toggleContent(true);
          delay(1000 - 100 * level, () => {
            this.cards[index].toggleContent(false);
            this.preview(++i);
          });
        });
      } else {
        this.play();
      }
    });
  }

  public play() {
    this.cards.splice(0, 9).map((c) => c.dispose());

    for (let i = 0; i < 9; i++) {
      const card = new Card(this.stage.element, i, (e) => {
        const data = this.sequence[this.currentStep];

        //if the selected card index matches the current step index advance
        data.correct = card.index == this.currentIndex;

        if (data.correct) {
          this.triggers.onClick(
            e.timeStamp,
            this.currentLevel,
            this.currentStep,
            true
          );

          this.currentStep++;
          //finished game?
          if (this.currentStep == this.sequence.length) {
            this.triggers.onFinishRound(true);
            return;
          }
          this.currentIndex = this.sequence[this.currentStep].index;
        } else {
          this.triggers.onClick(
            e.timeStamp,
            this.currentLevel,
            this.currentStep,
            false
          );
          this.triggers.onFinishRound(false);
          return;
        }
      });

      this.cards.push(card);
    }
  }

  public start(level: number) {
    this.setup(level);
    this.preview();
  }

  public dispose(): void {
    this.cards.splice(0, 9).map((c) => c.dispose());
    this.stage.dispose();
  }
}
