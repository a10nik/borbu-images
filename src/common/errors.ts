export interface IError {
    getText():string
}

export class ImageLoadError implements IError {
    getText():string { return "Cannot load image"; }
}