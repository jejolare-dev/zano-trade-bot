import { DataTypes, Model } from "sequelize";
import sequelize from "../database/database";
import Decimal from "decimal.js";

interface SettingsType {
    telegram_targets: string[]
}

class Settings extends Model {
    declare id: number;
    declare settings: SettingsType
}

Settings.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            defaultValue: 1
        },
        settings: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {}
        }
    },
    {
        sequelize,
        tableName: "settings",
    }
);

export default Settings;