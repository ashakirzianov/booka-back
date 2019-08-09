import * as fs from 'fs';
import * as FormData from 'form-data';
import { File } from './router';

export type Files = {
    [k: string]: File | undefined;
};
export function buildData(files: Files) {
    const formData = new FormData();
    for (const [name, fileDesc] of Object.entries(files)) {
        if (fileDesc) {
            const fileStream = fs.createReadStream(fileDesc.path);
            formData.append(name, fileStream, fileDesc.path);
        }
    }

    return {
        data: formData,
        headers: formData.getHeaders(),
    };
}
