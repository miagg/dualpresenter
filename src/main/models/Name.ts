export class Name {
  constructor(
    public id: number,
    public name: string,
    public group: string | null,
    public attending: boolean
  ) {}

  static fromArray(array: number | string[]): Name {
    return new Name(parseInt(array[0]), array[1], array[2] || null, array[3] === 'Yes')
  }
}
