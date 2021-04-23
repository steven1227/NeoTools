import { ipcRenderer } from "electron";
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
///<reference path="../dist/neo-sdk/neo-ts.d.ts"/>

namespace App {
    class Menu
    {
        div: HTMLDivElement;
        divMenu: HTMLDivElement;
        start(): void
        {
            this.createMenu();
            this.addMenuItem("convert");
            this.addMenuItem("createUnSignTx");
            this.addMenuItem("createMulti");
            this.addMenuItem("createAndSignMulti");
        }
        addText(str: string)
        {
            const link = document.createElement("a");
            link.textContent = str;
            this.divMenu.appendChild(link);
            this.divMenu.appendChild(document.createElement("hr"));//newline         
        }
        addLink(str: string, url: string)
        {
            const link = document.createElement("a");
            link.textContent = str;
            link.href = url;
            this.divMenu.appendChild(link);
            this.divMenu.appendChild(document.createElement("hr"));//newline         
        }
        addMenuItem(name:string)
        {
            const link = document.createElement("a");
            link.textContent = name;
            link.href = "#";
            this.divMenu.appendChild(link);
            link.onclick = () =>
            {
                ipcRenderer.send("createNewWin",name);
            };
    
            this.divMenu.appendChild(document.createElement("hr"));//newline            
        }
        createMenu()
        {
            this.divMenu = document.createElement("div");
            this.divMenu.style.left = "0px";
            this.divMenu.style.width = "200px";
            this.divMenu.style.top = "0px";
            this.divMenu.style.bottom = "0px";
            this.divMenu.style.position = "absolute";
            this.divMenu.style.overflow = "hidden";
            document.body.appendChild(this.divMenu);
    
        }
    }

    window.onload = () =>
    {
        const m = new Menu();
        m.start();
    };
}

