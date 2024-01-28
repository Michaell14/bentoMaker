import { useState, useEffect } from 'react';
import './App.css';
import MenuBar from './components/MenuBar';
import Login from './components/Login';
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react";
import TextCard from './components/TextCard';
import ImageCarousel from './components/ImageCarousel';
import { Form, useLoaderData, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export async function loader({ params } : { params: any }) {
  return { bentoId: params.bentoId };
}

function App() {
  const { toast } = useToast()
  const { bentoId } = useLoaderData();
  const [ cards, setCards ] = useState([]);
  const [ editable, setEditable ] = useState(false);
  const [ removable, setRemovable ] = useState(false);
  const [ userId, setUserId ] = useState("");
  const supabase = useSupabaseClient();
  const user = useUser();
  const navigate = useNavigate();

  const channels = 
  supabase.channel('room1')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Table'}, payload => {
      setCards(payload.new.blocks);
      setEditable(payload.new.isEditable);
      setRemovable(payload.new.isRemovable);
    })
    .subscribe()
  
  useEffect(() => {
    console.log(bentoId);
  }, [bentoId])

  useEffect(() => {
    async function fetchData() {
      let { data, error } = await supabase
      .from('Table')
      .select('user_id, blocks').eq("bentoId", bentoId);
      if (data && data[0]) {
        setCards(data[0].blocks);
        setUserId(data[0].user_id);
        console.log(data);
      }
    }
    
    async function setEditingRemoving() {

      if (user) {
        let { data, error } = await supabase
        .from('Table')
        .select('isEditable, isRemovable').eq('user_id', user?.id)
        if (data?.length) {
          setEditable(data[0].isEditable);
          setRemovable(data[0].isRemovable);
        }
      }
    }
    
    fetchData();
    setEditingRemoving();
    
  }, [user])

  async function signUserOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log(error);
    } else {
      toast({
        title: "Signed out",
        description: "You have been signed out.",
      })
      navigate("/");
    }
  }
  
  return (
    <>  
      <div className="absolute top-8 left-1/2 translate-x-[-50%]">
        { (user && user.id===userId) ? <MenuBar editable={editable} removable={removable}/>
        : <div>
            <p>{bentoId}'s card</p>
        </div>
        }
      </div>
      <div className="absolute top-8 right-8">
        <Button onClick={signUserOut}>Sign Out</Button>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] auto-rows-[170px] grid-flow-dense gap-5 mt-20">
        {cards ? cards.map((card, index) => (
            card?.type === "Text" ?
            <TextCard card={card} editable={editable} removable={removable} bentoId={bentoId} userId={userId} key={index}/>
            :
            card?.type === "Image" ?
            <ImageCarousel card={card} editable={editable} removable={removable} bentoId={bentoId} userId={userId} key={index}/>:
            <>
            </>

            ))
        :
          <>
            <p>There are no cards</p>
          </>
        }
      </div>
    </>
  )
}

export default App
