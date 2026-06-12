declare module '@lottiefiles/lottie-player/dist/tgs-player.esm.js' {
  interface TGSPlayerAttributes {
    src: string;
    autoplay?: boolean;
    loop?: boolean;
    mode?: 'normal' | 'bounce';
  }
  export class TGSPlayer extends HTMLElement {
    src: string;
    autoplay: boolean;
    loop: boolean;
    mode: 'normal' | 'bounce';
  }
  export default TGSPlayer;
}
