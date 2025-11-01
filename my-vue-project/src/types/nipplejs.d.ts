declare module 'nipplejs' {
  export interface Position {
    x: number
    y: number
  }

  export interface Direction {
    angle: string
    x: string
    y: string
  }

  export interface Vector {
    x: number
    y: number
  }

  export interface Data {
    identifier: number
    position: Position
    force: number
    pressure: number
    distance: number
    angle: {
      radian: number
      degree: number
    }
    direction: Direction
    vector: Vector
    raw: any
    instance: Joystick
  }

  export interface Joystick {
    on(
      type: string,
      handler: (evt: Event, data: Data) => void
    ): void
    off(
      type: string,
      handler: (evt: Event, data: Data) => void
    ): void
    destroy(): void
  }

  export interface JoystickManager {
    on(
      type: string,
      handler: (evt: Event, data: Data | Data[]) => void
    ): void
    off(
      type: string,
      handler: (evt: Event, data: Data | Data[]) => void
    ): void
    destroy(): void
    get(identifier: number): Joystick
    create(options: Options): Joystick
  }

  export interface Options {
    zone: HTMLElement
    color?: string
    size?: number
    threshold?: number
    fadeTime?: number
    multitouch?: boolean
    maxNumberOfNipples?: number
    mode?: 'dynamic' | 'semi' | 'static'
    position?: {
      top?: string
      left?: string
      bottom?: string
      right?: string
    }
    catchDistance?: number
    lockX?: boolean
    lockY?: boolean
  }

  export function create(options: Options): JoystickManager
}