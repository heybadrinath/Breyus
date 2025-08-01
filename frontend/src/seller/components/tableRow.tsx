import { table } from "console";
import React from "react";

interface tableRowProps {
    tableData: React.ReactNode[];
    className?: string;
}

export const TableRow: React.FC<tableRowProps> = ( {tableData, className} ) => {
    return (
        <tr className="mx-auto border-b-2">
            {tableData.map((data, index) => (
                <td key={index} className={className + "mx-auto py-5 align-middle text-center"}>{data}</td>
            ))}
        </tr>
    );

}