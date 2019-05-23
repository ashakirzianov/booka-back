import { Document, Schema, model } from 'mongoose';
import { TypeFromSchema } from './mongooseMapper';

const schema = {
    key: {
        type: String,
        index: true,
        required: true,
    },
    value: {
        type: String,
        required: true,
    },
};

export type Info = TypeFromSchema<typeof schema>;
type InfoDocument = Info & Document;

const InfoSchema = new Schema(schema, { timestamps: true });
const InfoCollection = model<InfoDocument>('Info', InfoSchema);

export async function getValue(key: string): Promise<string | undefined> {
    const info = await InfoCollection.findOne({ key }).exec();
    return info === null
        ? undefined
        : info.value;
}

export async function setValue(key: string, value: string) {
    await InfoCollection.updateOne({ key }, { value });
}
